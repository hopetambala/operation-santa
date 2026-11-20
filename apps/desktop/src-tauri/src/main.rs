#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{collections::{HashMap, HashSet}, fs::{self, File, OpenOptions}, io::Read, path::{Path, PathBuf}, sync::{Mutex, OnceLock}, time::{Duration, Instant}};
use argon2::{Argon2, Algorithm, Version, Params};
use rand::RngCore;
use rusqlite::{params, Connection, OptionalExtension};
use base64::{Engine as _, engine::general_purpose::STANDARD as B64};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use fs2::FileExt;
use zeroize::Zeroize;
// The database runs on a private working copy in app data; `path` is the user's file, rewritten in place after every save.
// `file` is the one handle on the user's file: it holds the lock, and all reads and writes go through it, because
// Windows file locks are mandatory and would block a second handle from the app itself.
struct OpenSeason { conn:Connection, path:PathBuf, work:PathBuf, root:PathBuf, file:File }
// Release the lock deterministically when the season closes, rather than leaving it to the handle's close.
impl Drop for OpenSeason { fn drop(&mut self){ let _=FileExt::unlock(&self.file); } }
#[derive(Default)]
struct Store(Mutex<Option<OpenSeason>>);
fn keyed(path:&Path,pass:&str,create:bool)->Result<Connection,String>{
 if pass.len()<10{return Err("Use a passphrase with at least 10 characters.".into())}
 let mut salt=[0u8;16];
 if create{rand::thread_rng().fill_bytes(&mut salt)}else{File::open(path).and_then(|mut f|f.read_exact(&mut salt)).map_err(|_|"Unable to read season file.")?;}
 let params=Params::new(65536,3,1,Some(32)).map_err(|e|e.to_string())?;
 let mut key=[0u8;32];Argon2::new(Algorithm::Argon2id,Version::V0x13,params).hash_password_into(pass.as_bytes(),&salt,&mut key).map_err(|e|e.to_string())?;
 let conn=Connection::open(path).map_err(|_|"Cannot open season file.")?;
 let mut raw=format!("x'{}{}'",hex::encode(key),hex::encode(salt));key.zeroize();
 let result=conn.pragma_update(None,"key",&raw);raw.zeroize();result.map_err(|_|"Encryption initialization failed.")?;
 conn.query_row("SELECT count(*) FROM sqlite_master",[],|r|r.get::<_,i64>(0)).map_err(|_|"Incorrect passphrase or damaged season file.")?;
 let version:i64=conn.pragma_query_value(None,"user_version",|r|r.get(0)).map_err(|e|e.to_string())?;
 if version>1{return Err("This season was created by a newer version of Operation Santa.".into())}
 Ok(conn)
}
fn connection(path:&Path,pass:&str,create:bool)->Result<Connection,String>{
 let conn=keyed(path,pass,create)?;
 conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA secure_delete=ON; CREATE TABLE IF NOT EXISTS season_state(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS asset(hash TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes INTEGER NOT NULL, data BLOB NOT NULL, created_at TEXT); PRAGMA user_version=1;").map_err(|e|e.to_string())?;
 Ok(conn)
}
fn validate(data:&str)->Result<(),String>{let value:serde_json::Value=serde_json::from_str(data).map_err(|_|"Invalid season data.")?;if value["schema"]!=1||!value["families"].is_array()||!value["routes"].is_array(){return Err("Unsupported season format.".into())}Ok(())}
// Season storage, independent of Tauri so it can be tested. `root` is the app's private data folder.
// The App Store sandbox (and synced folders like Google Drive) only tolerate the one file the user chose, so the
// SQLite WAL, backups and lock all live elsewhere: WAL and backups in `root`, the lock on the file itself.
fn sha_hex(bytes:&[u8])->String{hex::encode(Sha256::digest(bytes))}
fn key_of(path:&Path)->String{sha_hex(path.to_string_lossy().as_bytes())}
fn work_of(root:&Path,path:&Path)->PathBuf{root.join(format!("{}.opsanta",key_of(path)))}
fn published_of(root:&Path,path:&Path)->PathBuf{root.join(format!("{}.published",key_of(path)))}
fn remove_work(work:&Path){for ext in ["","-wal","-shm"]{let _=fs::remove_file(format!("{}{ext}",work.display()));}}
fn lock_season(path:&Path)->Result<File,String>{let f=OpenOptions::new().read(true).write(true).open(path).map_err(|_|"Cannot open season file.")?;f.try_lock_exclusive().map_err(|_|"This season is already open in another app. Close it there first.")?;Ok(f)}
fn write_through(mut f:&File,bytes:&[u8])->std::io::Result<()>{use std::io::{Seek,SeekFrom,Write};f.set_len(0)?;f.seek(SeekFrom::Start(0))?;f.write_all(bytes)?;f.sync_all()}
fn read_through(mut f:&File)->std::io::Result<Vec<u8>>{use std::io::{Seek,SeekFrom};f.seek(SeekFrom::Start(0))?;let mut v=vec![];f.read_to_end(&mut v)?;Ok(v)}
// Write the working copy back into the user's file in place (no temp or sidecar files beside it).
fn publish(s:&OpenSeason)->Result<(),String>{s.conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);").map_err(|e|e.to_string())?;let bytes=fs::read(&s.work).map_err(|_|"Cannot read the working copy.")?;write_through(&s.file,&bytes).map_err(|_|"Cannot write the season file.")?;fs::write(published_of(&s.root,&s.path),sha_hex(&bytes)).map_err(|_|"Cannot record the save.".into())}
fn create_in(path:&Path,pass:&str,data:&str,root:&Path)->Result<OpenSeason,String>{validate(data)?;if path.exists(){return Err("A file already exists at this location. Choose a new name.".into())}let work=work_of(root,path);remove_work(&work);let conn=connection(&work,pass,true)?;conn.execute("INSERT INTO season_state(id,data) VALUES(1,?1)",[data]).map_err(|e|e.to_string())?;OpenOptions::new().write(true).create_new(true).open(path).map_err(|_|"Cannot create the season file.")?;let lock=lock_season(path)?;let s=OpenSeason{conn,path:path.into(),work,root:root.into(),file:lock};publish(&s)?;Ok(s)}
fn open_in(path:&Path,pass:&str,root:&Path)->Result<(OpenSeason,String),String>{if !path.is_file(){return Err("Season file not found.".into())}let lock=lock_season(path)?;let work=work_of(root,path);let file=read_through(&lock).map_err(|_|"Unable to read season file.")?;
 // Reuse the working copy only if the user's file is exactly what we last wrote: it may hold a save that crashed before publishing.
 // If the file changed outside the app (restored backup, another computer), the file wins.
 let ours=work.is_file()&&fs::read_to_string(published_of(root,path)).is_ok_and(|h|h.trim()==sha_hex(&file));if !ours{remove_work(&work);fs::write(&work,&file).map_err(|_|"Cannot prepare the working copy.")?;}
 let conn=connection(&work,pass,false)?;let data:String=conn.query_row("SELECT data FROM season_state WHERE id=1",[],|r|r.get(0)).map_err(|_|"This is not an Operation Santa season.")?;validate(&data)?;let s=OpenSeason{conn,path:path.into(),work,root:root.into(),file:lock};if ours{publish(&s)?;}Ok((s,data))}
fn save_to(s:&mut OpenSeason,data:&str)->Result<(),String>{validate(data)?;let tx=s.conn.transaction().map_err(|e|e.to_string())?;tx.execute("UPDATE season_state SET data=?1 WHERE id=1",[data]).map_err(|e|e.to_string())?;tx.commit().map_err(|e|e.to_string())?;publish(s)}
fn backup_of(s:&OpenSeason)->Result<PathBuf,String>{s.conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);").map_err(|e|e.to_string())?;let dir=s.root.join("backups").join(key_of(&s.path));fs::create_dir_all(&dir).map_err(|e|e.to_string())?;let stamp=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis();let dest=dir.join(format!("{stamp:015}-{:04x}.opsanta",rand::random::<u16>()));fs::copy(&s.work,&dest).map_err(|e|e.to_string())?;let mut entries=fs::read_dir(&dir).map_err(|e|e.to_string())?.filter_map(Result::ok).map(|e|e.path()).filter(|p|p.extension().is_some_and(|e|e=="opsanta")).collect::<Vec<_>>();entries.sort();let remove=entries.len().saturating_sub(20);for p in entries.into_iter().take(remove){fs::remove_file(p).map_err(|e|e.to_string())?;}Ok(dest)}
// After a purge succeeds, backups taken before it would still hold children's data, so they go too.
fn purge_backups_of(s:&OpenSeason)->Result<u32,String>{let dir=s.root.join("backups").join(key_of(&s.path));if !dir.is_dir(){return Ok(0)}let n=fs::read_dir(&dir).map_err(|e|e.to_string())?.filter_map(Result::ok).filter(|e|e.path().extension().is_some_and(|x|x=="opsanta")).count() as u32;fs::remove_dir_all(&dir).map_err(|_|"Could not delete this season's backups.")?;Ok(n)}
// A clean close publishes and deletes the working copy, so app data keeps no extra copy of families' records.
fn close_out(s:OpenSeason)->Result<(),String>{publish(&s)?;let work=s.work.clone();drop(s);remove_work(&work);Ok(())}
// E2E builds only: OPSANTA_DATA_DIR gives each test run a fresh app data folder (e2e/wdio.conf.ts), the way VS Code's and
// Zed's test launches use a throwaway user-data-dir. Release and dev builds ignore it.
fn app_data(app:&tauri::AppHandle)->Result<PathBuf,String>{
 #[cfg(feature="e2e")]if let Some(d)=std::env::var_os("OPSANTA_DATA_DIR").filter(|d|!d.is_empty()){return Ok(PathBuf::from(d))}
 use tauri::Manager;app.path().app_data_dir().map_err(|_|"No app data folder.".into())}
fn seasons_root(app:&tauri::AppHandle)->Result<PathBuf,String>{let d=app_data(app)?.join("seasons");fs::create_dir_all(&d).map_err(|_|"Cannot create the app data folder.")?;Ok(d)}
// Argon2id here is m=64MiB, t=3, p=1: 90ms on this machine before the season file is even read.
// A plain command runs on the UI thread. `async` is Tauri's blocking-pool flag, same as save_season.
#[tauri::command(async)]
fn create_season(path:String,mut passphrase:String,data:String,app:tauri::AppHandle,store:tauri::State<Store>)->Result<(),String>{let root=seasons_root(&app)?;let r=create_in(Path::new(&path),&passphrase,&data,&root);passphrase.zeroize();*store.0.lock().map_err(|_|"Season is busy.")?=Some(r?);Ok(())}
#[tauri::command(async)]
fn open_season(path:String,mut passphrase:String,app:tauri::AppHandle,store:tauri::State<Store>)->Result<String,String>{let root=seasons_root(&app)?;let r=open_in(Path::new(&path),&passphrase,&root);passphrase.zeroize();let (s,data)=r?;*store.0.lock().map_err(|_|"Season is busy.")?=Some(s);Ok(data)}
// Off the main thread: a save rewrites and flushes the whole file, which would freeze the window meanwhile.
#[tauri::command(async)]
fn save_season(data:String,store:tauri::State<Store>)->Result<(),String>{let mut g=store.0.lock().map_err(|_|"Season is busy.")?;save_to(g.as_mut().ok_or("No encrypted season is open.")?,&data)}
#[tauri::command(async)]
fn backup_season(store:tauri::State<Store>)->Result<String,String>{let g=store.0.lock().map_err(|_|"Season is busy.")?;Ok(backup_of(g.as_ref().ok_or("No season open.")?)?.display().to_string())}
// After an update installs (only when the coordinator clicked "Install and restart").
#[tauri::command]
fn restart_app(app:tauri::AppHandle){app.restart()}
// Whether this build updates itself. Only the DMG and Windows builds do; the Mac App Store build must not even offer to
// (App Review guideline 2.4.5), so Settings hides "Check for updates" when this is false.
#[tauri::command]
fn updater_built_in()->bool{cfg!(feature="updater")}
#[tauri::command]
fn purge_backups(store:tauri::State<Store>)->Result<u32,String>{let g=store.0.lock().map_err(|_|"Season is busy.")?;purge_backups_of(g.as_ref().ok_or("No encrypted season is open.")?)}
// close publishes the whole database back to the user's file, same rewrite save_season keeps off the UI thread.
#[tauri::command(async)]
fn close_season(store:tauri::State<Store>)->Result<(),String>{let s=store.0.lock().map_err(|_|"Season is busy.")?.take();match s{Some(s)=>close_out(s),None=>Ok(())}}
// The keychain service is the running app's bundle ID, so "Operation Santa Dev" (tauri.dev.conf.json), the sandbox proof
// and the real app never read or overwrite each other's saved passphrases (ONBOARDING-AND-ENVIRONMENTS-PLAN.md §2).
static SERVICE:OnceLock<String>=OnceLock::new();
fn service()->Result<&'static str,String>{SERVICE.get().map(String::as_str).ok_or_else(||"Keychain is not ready yet.".into())}
// Window titles follow productName, so the Dev build says "Operation Santa Dev" in the title bar and Mission Control.
fn identity_setup(app:&tauri::App){use tauri::Manager;let _=SERVICE.set(app.config().identifier.clone());let name=app.package_info().name.clone();for w in app.webview_windows().values(){let _=w.set_title(&name);}}
// Before a recent season opens (welcome window): "ok", "missing" (moved or deleted), or "denied". The Mac App Store build
// may only read a file the coordinator picked in this run, so after a relaunch a recent season is "denied" there and the
// window asks for it in the Open panel, already in its folder.
#[tauri::command(async)]
fn season_access(path:String)->&'static str{let p=Path::new(&path);if !p.is_absolute()||p.extension().is_none_or(|e|e!="opsanta"){return "missing"}match File::open(p){Ok(_)=>"ok",Err(e) if e.kind()==std::io::ErrorKind::NotFound=>"missing",Err(_)=>"denied"}}
// ── Move to Applications (direct-download build only) ──────────────────────────────────────────────────────────────
// Opened from a disk image or Downloads, macOS runs a downloaded app from a random read-only copy ("App Translocation"),
// where it can't update itself. Slack, Discord, Claude, Canva and GitHub Desktop all offer to move themselves into
// Applications; this follows GitHub Desktop's dialog (ONBOARDING-AND-ENVIRONMENTS-PLAN.md §3). The Mac App Store build
// never asks: the store installs it in Applications, and the sandbox couldn't move it anyway.
#[derive(Serialize,Debug,PartialEq)]#[serde(rename_all="camelCase")]
struct InstallLocation{suggest_move:bool,place:String,destination:String}
// Why this copy should move: "a disk image", "Downloads", "Desktop" or "a temporary copy" (translocated). None when
// it's in an Applications folder, or anywhere else (a developer's build folder, a folder someone chose on purpose).
fn misplaced(bundle:&Path,apps:&Path,home:&Path)->Option<&'static str>{
 if bundle.starts_with(apps)||bundle.starts_with(home.join("Applications")){return None}
 if bundle.components().any(|c|c.as_os_str()=="AppTranslocation"){return Some("a temporary copy")}
 if bundle.starts_with("/Volumes"){return Some("a disk image")}
 if bundle.starts_with(home.join("Downloads")){return Some("Downloads")}
 if bundle.starts_with(home.join("Desktop")){return Some("Desktop")}
 None
}
fn running_bundle()->Option<PathBuf>{let exe=std::env::current_exe().ok()?;let b=exe.parent()?.parent()?.parent()?;(b.extension()?=="app").then(||b.to_path_buf())}
fn home()->Option<PathBuf>{std::env::var_os("HOME").map(PathBuf::from)}
// Debug builds can point "Applications" elsewhere, so the move can be tried without touching the real folder.
fn applications_dir()->PathBuf{#[cfg(debug_assertions)]if let Some(d)=std::env::var_os("OPSANTA_APPLICATIONS_DIR"){return PathBuf::from(d)}PathBuf::from("/Applications")}
#[tauri::command]
fn install_location()->InstallLocation{
 let none=InstallLocation{suggest_move:false,place:String::new(),destination:String::new()};
 if !cfg!(all(target_os="macos",feature="updater")){return none}
 let (Some(bundle),Some(home))=(running_bundle(),home()) else {return none};
 let apps=applications_dir();
 match misplaced(&bundle,&apps,&home){Some(place)=>InstallLocation{suggest_move:true,place:place.into(),destination:apps.join(bundle.file_name().unwrap_or_default()).display().to_string()},None=>none}
}
// Copies the app into Applications (ditto keeps its signature), clears the download quarantine on the copy, puts an
// older copy there in the Trash, and puts the original in the Trash when it sits in an ordinary folder. A disk image
// or a translocated copy is read-only and is left alone.
// macOS only (ditto, xattr, the Trash). The App Store build compiles it but never calls it.
#[cfg(target_os="macos")]#[cfg_attr(not(feature="updater"),allow(dead_code))]
fn move_bundle(src:&Path,apps:&Path,trash:&Path)->Result<PathBuf,String>{
 let name=src.file_name().ok_or("This copy of the app has no name.")?;let dest=apps.join(name);
 let stamp=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
 let trashed=|p:&Path,what:&str|trash.join(format!("{} ({what} {stamp}).app",p.file_stem().unwrap_or_default().to_string_lossy()));
 if dest.exists(){fs::create_dir_all(trash).ok();fs::rename(&dest,trashed(&dest,"replaced")).map_err(|_|"An older copy in Applications couldn't be moved to the Trash. Quit it if it's open, or drag Operation Santa into Applications yourself.")?;}
 let copied=std::process::Command::new("/usr/bin/ditto").arg(src).arg(&dest).status().map(|s|s.success()).unwrap_or(false);
 if !copied{let _=fs::remove_dir_all(&dest);return Err("Operation Santa couldn't copy itself into Applications. On some Macs that needs an administrator: drag Operation Santa into Applications instead.".into())}
 let _=std::process::Command::new("/usr/bin/xattr").args(["-dr","com.apple.quarantine"]).arg(&dest).status();
 let read_only=src.starts_with("/Volumes")||src.components().any(|c|c.as_os_str()=="AppTranslocation");
 if !read_only{fs::create_dir_all(trash).ok();let _=fs::rename(src,trashed(src,"moved to Applications"));}
 Ok(dest)
}
#[tauri::command(async)]
fn move_to_applications(app:tauri::AppHandle)->Result<(),String>{
 #[cfg(all(target_os="macos",feature="updater"))]{
  let src=running_bundle().ok_or("Couldn't find this copy of the app.")?;let home=home().ok_or("No home folder.")?;
  let dest=move_bundle(&src,&applications_dir(),&home.join(".Trash"))?;
  std::process::Command::new("/usr/bin/open").arg("-n").arg(&dest).spawn().map_err(|_|"Moved to Applications. Open it from there.")?;
  app.exit(0);Ok(())
 }
 #[cfg(not(all(target_os="macos",feature="updater")))]{let _=app;Err("This copy of Operation Santa is managed by the App Store.".into())}
}
// The volunteer guide (site/, GitHub Pages). Only this site opens, at a page path made of letters, digits, - and /.
const GUIDE_URL:&str="https://hopetambala.github.io/operation-santa/";
fn guide_page_ok(p:&str)->bool{p.len()<120&&!p.starts_with('/')&&!p.contains("//")&&p.chars().all(|c|c.is_ascii_alphanumeric()||c=='-'||c=='/')}
#[tauri::command]
fn open_guide(page:Option<String>,app:tauri::AppHandle)->Result<(),String>{use tauri_plugin_opener::OpenerExt;let page=page.unwrap_or_default();if !guide_page_ok(&page){return Err("Unknown guide page.".into())}app.opener().open_url(format!("{GUIDE_URL}{page}"),None::<&str>).map_err(|e|format!("Could not open the guide: {e}"))}
// Address review's "Open in Google Maps" (RELEASE-UX-PLAN item 6): a Maps search for the street, city and ZIP only,
// opened in the default browser. Only this URL shape opens; names and gate codes never leave.
fn map_url(address:&str)->Result<String,String>{let a=address.trim();if a.is_empty()||a.len()>200||a.chars().any(|c|c.is_control()){return Err("That address can't be opened in Google Maps.".into())}tauri::Url::parse_with_params("https://www.google.com/maps/search/",&[("api","1"),("query",a)]).map(|u|u.to_string()).map_err(|e|e.to_string())}
#[tauri::command]
fn open_map(address:String,app:tauri::AppHandle)->Result<(),String>{use tauri_plugin_opener::OpenerExt;let url=map_url(&address)?;app.opener().open_url(url,None::<&str>).map_err(|e|format!("Could not open Google Maps: {e}"))}
// One window, two sizes (ONBOARDING-AND-ENVIRONMENTS-PLAN.md §4). With no season open it is a small welcome window, the
// way Xcode and Obsidian open; with a season open it is the workspace, at the size and place the coordinator left it
// (HIG: restore window state). The workspace frame is kept in app data as window.json.
const WELCOME:(f64,f64)=(760.0,520.0);
const WORKSPACE_DEFAULT:(f64,f64)=(1440.0,940.0);
const WORKSPACE_MIN:(f64,f64)=(1000.0,700.0);
static IN_WORKSPACE:Mutex<bool>=Mutex::new(false);
#[derive(Serialize,Deserialize,Clone,Copy,Debug,PartialEq)]
struct Frame{x:f64,y:f64,w:f64,h:f64}
fn frame_file(app:&tauri::AppHandle)->Option<PathBuf>{app_data(app).ok().map(|d|d.join("window.json"))}
fn read_frame(app:&tauri::AppHandle)->Option<Frame>{let f:Frame=serde_json::from_str(&fs::read_to_string(frame_file(app)?).ok()?).ok()?;(f.w>=WORKSPACE_MIN.0&&f.h>=WORKSPACE_MIN.1&&f.w<20000.0&&f.h<20000.0).then_some(f)}
fn save_frame(w:&tauri::WebviewWindow){use tauri::Manager;
 if w.is_fullscreen().unwrap_or(false)||w.is_minimized().unwrap_or(false){return}
 let (Ok(scale),Ok(pos),Ok(size))=(w.scale_factor(),w.outer_position(),w.inner_size()) else {return};
 let (p,sz)=(pos.to_logical::<f64>(scale),size.to_logical::<f64>(scale));
 let Some(file)=frame_file(w.app_handle()) else {return};
 if let Some(dir)=file.parent(){let _=fs::create_dir_all(dir);}
 let _=fs::write(file,serde_json::to_string(&Frame{x:p.x,y:p.y,w:sz.width,h:sz.height}).unwrap_or_default());
}
// A saved frame is used only if its top-left corner is on a screen that is still attached, and only up to that screen's size.
fn fit(w:&tauri::WebviewWindow,f:Option<Frame>)->(Frame,bool){
 let monitors=w.available_monitors().unwrap_or_default();
 let on=|x:f64,y:f64|monitors.iter().find(|m|{let s=m.scale_factor();let p=m.position().to_logical::<f64>(s);let z=m.size().to_logical::<f64>(s);x>=p.x&&y>=p.y&&x<p.x+z.width-40.0&&y<p.y+z.height-40.0});
 if let Some(f)=f{if let Some(m)=on(f.x,f.y){let s=m.scale_factor();let z=m.size().to_logical::<f64>(s);return (Frame{w:f.w.min(z.width),h:f.h.min(z.height),..f},true)}}
 let screen=w.current_monitor().ok().flatten().map(|m|m.size().to_logical::<f64>(m.scale_factor()));
 let (sw,sh)=screen.map_or(WORKSPACE_DEFAULT,|z|(z.width*0.94,z.height*0.92));
 (Frame{x:0.0,y:0.0,w:WORKSPACE_DEFAULT.0.min(sw).max(WORKSPACE_MIN.0),h:WORKSPACE_DEFAULT.1.min(sh).max(WORKSPACE_MIN.1)},false)
}
fn apply_mode(w:&tauri::WebviewWindow,workspace:bool)->tauri::Result<()>{
 use tauri::{LogicalPosition,LogicalSize,Size,Position,Manager};
 let mut current=IN_WORKSPACE.lock().unwrap_or_else(|e|e.into_inner());
 if *current==workspace{return Ok(())}
 if workspace{
  let (f,placed)=fit(w,read_frame(w.app_handle()));
  w.set_resizable(true)?;w.set_maximizable(true)?;w.set_min_size(Some(Size::Logical(LogicalSize::new(WORKSPACE_MIN.0,WORKSPACE_MIN.1))))?;
  w.set_size(Size::Logical(LogicalSize::new(f.w,f.h)))?;
  if placed{w.set_position(Position::Logical(LogicalPosition::new(f.x,f.y)))?;}else{w.center()?;}
 }else{
  save_frame(w);
  if w.is_fullscreen().unwrap_or(false){w.set_fullscreen(false)?;}
  if w.is_maximized().unwrap_or(false){w.unmaximize()?;}
  w.set_min_size(None::<Size>)?;w.set_size(Size::Logical(LogicalSize::new(WELCOME.0,WELCOME.1)))?;w.set_resizable(false)?;w.set_maximizable(false)?;w.center()?;
 }
 *current=workspace;Ok(())
}
#[tauri::command]
fn window_mode(workspace:bool,window:tauri::WebviewWindow)->Result<(),String>{apply_mode(&window,workspace).map_err(|e|e.to_string())}
// macOS menu bar (Apple's standard App, File, Edit, View, Window, Help menus). Items the app handles go to the webview as a
// "menu" event with the item's id; the predefined ones (Edit, Window, About, Quit) are the system's own.
#[cfg(target_os="macos")]
fn app_menu(app:&tauri::App)->tauri::Result<tauri::menu::Menu<tauri::Wry>>{
 use tauri::menu::{AboutMetadataBuilder,MenuBuilder,MenuItemBuilder,SubmenuBuilder};
 let item=|id:&str,text:&str,key:Option<&str>|{let b=MenuItemBuilder::with_id(id,text);match key{Some(k)=>b.accelerator(k),None=>b}.build(app)};
 let p=app.package_info();
 let channel=if cfg!(feature="updater"){"Direct download"}else{"Mac App Store / TestFlight"};
 let about=AboutMetadataBuilder::new().name(Some(p.name.clone())).version(Some(p.version.to_string())).short_version(None::<String>).copyright(Some("© 2026 Pasadena Jaycees")).credits(Some(format!("Season and Christmas Eve delivery planning.\n{channel}"))).build();
 let app_menu=SubmenuBuilder::new(app,&p.name).about(Some(about)).separator().item(&item("settings","Settings…",Some("CmdOrCtrl+,"))?).separator().services().separator().hide().hide_others().show_all().separator().quit().build()?;
 let file=SubmenuBuilder::new(app,"File").item(&item("new_season","New Season…",Some("CmdOrCtrl+N"))?).item(&item("open_season","Open Season…",Some("CmdOrCtrl+O"))?).separator().item(&item("import","Import Airtable Export…",Some("CmdOrCtrl+I"))?).item(&item("print","Print Center",Some("CmdOrCtrl+P"))?).separator().item(&item("lock","Lock Season",Some("CmdOrCtrl+L"))?).separator().close_window().build()?;
 let edit=SubmenuBuilder::new(app,"Edit").undo().redo().separator().cut().copy().paste().select_all().build()?;
 let view=SubmenuBuilder::new(app,"View").item(&item("step_1","1  Import",Some("CmdOrCtrl+1"))?).item(&item("step_2","2  Routes",Some("CmdOrCtrl+2"))?).item(&item("step_3","3  Letters",Some("CmdOrCtrl+3"))?).item(&item("step_4","4  Print",Some("CmdOrCtrl+4"))?).separator().item(&item("change_log","Change Log",None)?).separator().fullscreen().build()?;
 let window=SubmenuBuilder::new(app,"Window").minimize().maximize().build()?;
 let help=SubmenuBuilder::new(app,"Help").item(&item("guide","Operation Santa Guide",Some("CmdOrCtrl+?"))?).item(&item("four_steps","How the Four Steps Work",None)?).build()?;
 let menu=MenuBuilder::new(app).items(&[&app_menu,&file,&edit,&view,&window,&help]).build()?;
 let _=window.set_as_windows_menu_for_nsapp();let _=help.set_as_help_menu_for_nsapp();
 Ok(menu)
}
#[derive(Serialize)]#[serde(rename_all="camelCase")]
struct AppIdentity{identifier:String,name:String,version:String,dev:bool,self_updating:bool}
// The webview shows a "Dev build" ribbon from this, and About shows the version. `dev` is any identity but the
// production one, so a renamed or sandbox-test build is never mistaken for the real app either.
#[tauri::command]
fn app_identity(app:tauri::AppHandle)->AppIdentity{let identifier=app.config().identifier.clone();let p=app.package_info();AppIdentity{dev:identifier!="org.pasadenajaycees.opsanta",identifier,name:p.name.clone(),version:p.version.to_string(),self_updating:cfg!(feature="updater")}}
const UA:&str="OperationSanta/0.1 (Pasadena Jaycees route planner; local desktop app)";
const MAX_ATTACHMENT:usize=30*1024*1024;
static AIRTABLE_SLOT:Mutex<Option<Instant>>=Mutex::new(None);
static NOMINATIM_SLOT:Mutex<Option<Instant>>=Mutex::new(None);
static ATTACH_CLIENT:OnceLock<reqwest::Client>=OnceLock::new();
static API_CLIENT:OnceLock<reqwest::Client>=OnceLock::new();
fn allowed_url(u:&reqwest::Url)->bool{u.scheme()=="https"&&u.username().is_empty()&&u.password().is_none()&&u.port().is_none()&&u.host_str().is_some_and(|h|{let h=h.to_ascii_lowercase();["airtableusercontent.com","dl.airtable.com","airtable.com"].iter().any(|d|h==*d||h.ends_with(&format!(".{d}")))})}
fn client(cell:&'static OnceLock<reqwest::Client>,policy:fn()->reqwest::redirect::Policy)->Result<&'static reqwest::Client,String>{if let Some(c)=cell.get(){return Ok(c)}let c=reqwest::Client::builder().user_agent(UA).redirect(policy()).timeout(Duration::from_secs(60)).build().map_err(|e|format!("Network setup failed: {e}"))?;Ok(cell.get_or_init(||c))}
fn attach_client()->Result<&'static reqwest::Client,String>{client(&ATTACH_CLIENT,||reqwest::redirect::Policy::custom(|a|if a.previous().len()>=10{a.error("Too many redirects.")}else if allowed_url(a.url()){a.follow()}else{a.error("Redirect to a non-Airtable host was blocked.")}))}
fn api_client()->Result<&'static reqwest::Client,String>{client(&API_CLIENT,reqwest::redirect::Policy::none)}
fn net(e:reqwest::Error)->String{if e.is_timeout(){"The request timed out.".into()}else{format!("Network error: {}",e.without_url())}}
fn api_reason(text:&str)->String{let v:serde_json::Value=serde_json::from_str(text).unwrap_or_default();let e=&v["error"];let s=match e{serde_json::Value::String(s)=>s.clone(),_=>[e["type"].as_str(),e["message"].as_str()].into_iter().flatten().collect::<Vec<_>>().join(": ")};let s:String=s.chars().filter(|c|!c.is_control()).take(160).collect();if s.is_empty(){"no details".into()}else{s}}
async fn throttle(slot:&'static Mutex<Option<Instant>>,gap:Duration){let wait={let mut g=slot.lock().unwrap_or_else(|e|e.into_inner());let now=Instant::now();let next=g.map_or(now,|t|(t+gap).max(now));*g=Some(next);next-now};if !wait.is_zero(){let _=tauri::async_runtime::spawn_blocking(move||std::thread::sleep(wait)).await;}}
fn b64(s:&str)->Result<Vec<u8>,String>{B64.decode(s.trim()).map_err(|_|"Invalid base64 data.".into())}
#[derive(Serialize)]#[serde(rename_all="camelCase")]
struct Attachment{status:u16,content_type:String,data:String}
#[tauri::command]
async fn fetch_attachment(url:String)->Result<Attachment,String>{
 let u=reqwest::Url::parse(&url).map_err(|_|"Invalid attachment link.")?;
 if !allowed_url(&u){return Err("Only https Airtable attachment links can be downloaded.".into())}
 let mut r=attach_client()?.get(u).send().await.map_err(net)?;
 let status=r.status().as_u16();let content_type=r.headers().get(reqwest::header::CONTENT_TYPE).and_then(|v|v.to_str().ok()).unwrap_or("").to_string();
 if status!=200{return Ok(Attachment{status,content_type,data:String::new()})}
 if r.content_length().is_some_and(|n|n>MAX_ATTACHMENT as u64){return Err("Attachment is larger than 30 MB.".into())}
 let mut buf=Vec::new();while let Some(c)=r.chunk().await.map_err(net)?{if buf.len()+c.len()>MAX_ATTACHMENT{return Err("Attachment is larger than 30 MB.".into())}buf.extend_from_slice(&c);}
 Ok(Attachment{status,content_type,data:B64.encode(buf)})
}
fn valid_airtable_path(p:&str)->bool{p.starts_with("app")&&p.len()<=2048&&!p.contains("..")&&p.chars().all(|c|c.is_ascii_alphanumeric()||"/?=&-_.%".contains(c))}
#[tauri::command]
async fn airtable_get(path:String)->Result<String,String>{
 if !valid_airtable_path(&path){return Err("Invalid Airtable path.".into())}
 let mut token=secret_read("airtable_token")?.ok_or("Connect Airtable in Settings first.")?;
 throttle(&AIRTABLE_SLOT,Duration::from_millis(220)).await;
 let sent=api_client()?.get(format!("https://api.airtable.com/v0/{path}")).bearer_auth(&token).send().await;token.zeroize();
 let r=sent.map_err(net)?;let status=r.status();let text=r.text().await.map_err(net)?;
 if !status.is_success(){return Err(format!("Airtable request failed ({}): {}",status.as_u16(),api_reason(&text)))}
 Ok(text)
}
fn valid_secret(n:&str)->bool{n=="airtable_token"||n.strip_prefix("passphrase:").is_some_and(|u|u.len()==36&&u.chars().all(|c|c.is_ascii_digit()||('a'..='f').contains(&c)||c=='-'))}
fn entry(n:&str)->Result<keyring::Entry,String>{if !valid_secret(n){return Err("Unknown secret name.".into())}keyring::Entry::new(service()?,n).map_err(|e|format!("Keychain unavailable: {e}"))}
fn secret_read(n:&str)->Result<Option<String>,String>{match entry(n)?.get_password(){Ok(v)=>Ok(Some(v)),Err(keyring::Error::NoEntry)=>Ok(None),Err(e)=>Err(format!("Keychain error: {e}"))}}
#[tauri::command(async)]
fn secret_set(name:String,mut value:String)->Result<(),String>{let r=entry(&name).and_then(|e|e.set_password(&value).map_err(|e|format!("Keychain error: {e}")));value.zeroize();r}
#[tauri::command(async)]
fn secret_get(name:String)->Result<Option<String>,String>{secret_read(&name)}
#[tauri::command(async)]
fn secret_delete(name:String)->Result<(),String>{match entry(&name)?.delete_credential(){Ok(())|Err(keyring::Error::NoEntry)=>Ok(()),Err(e)=>Err(format!("Keychain error: {e}"))}}
// LR-10: the Census request refuses any field beyond these five, so a name or phone can't ride along.
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct CensusRow{id:String,street:String,city:String,state:String,zip:String}
#[derive(Serialize,Clone,Debug,PartialEq)]#[serde(rename_all="camelCase")]
struct CensusHit{id:String,matched:bool,exact:bool,lat:Option<f64>,lon:Option<f64>,matched_address:String}
fn census_csv(rows:&[CensusRow])->Result<Vec<u8>,String>{let mut w=csv::WriterBuilder::new().has_headers(false).from_writer(vec![]);for r in rows{w.write_record([&r.id,&r.street,&r.city,&r.state,&r.zip]).map_err(|e|e.to_string())?;}w.into_inner().map_err(|e|e.to_string())}
fn parse_census(text:&str)->HashMap<String,CensusHit>{
 let mut out=HashMap::new();let mut rd=csv::ReaderBuilder::new().has_headers(false).flexible(true).from_reader(text.as_bytes());
 for rec in rd.records().flatten(){let g=|i:usize|rec.get(i).unwrap_or("").trim();let id=g(0).to_string();if id.is_empty(){continue}
  let (lon,lat)=g(5).split_once(',').map_or((None,None),|(a,b)|(a.trim().parse::<f64>().ok(),b.trim().parse::<f64>().ok()));
  let ok=g(2)=="Match"&&lon.is_some()&&lat.is_some();
  out.insert(id.clone(),CensusHit{id,matched:ok,exact:ok&&g(3)=="Exact",lat:lat.filter(|_|ok),lon:lon.filter(|_|ok),matched_address:if ok{g(4).into()}else{String::new()}});}
 out
}
#[tauri::command]
async fn geocode_census(rows:Vec<CensusRow>)->Result<Vec<CensusHit>,String>{
 let mut out=Vec::with_capacity(rows.len());
 for chunk in rows.chunks(1000){
  let file=reqwest::multipart::Part::bytes(census_csv(chunk)?).file_name("addresses.csv").mime_str("text/csv").map_err(|e|e.to_string())?;
  let form=reqwest::multipart::Form::new().text("benchmark","Public_AR_Current").part("addressFile",file);
  let r=api_client()?.post("https://geocoding.geo.census.gov/geocoder/locations/addressbatch").multipart(form).timeout(Duration::from_secs(180)).send().await.map_err(net)?;
  if !r.status().is_success(){return Err(format!("Census geocoder returned HTTP {}.",r.status().as_u16()))}
  let hits=parse_census(&r.text().await.map_err(net)?);
  out.extend(chunk.iter().map(|row|hits.get(&row.id).cloned().unwrap_or(CensusHit{id:row.id.clone(),matched:false,exact:false,lat:None,lon:None,matched_address:String::new()})));
 }
 Ok(out)
}
#[derive(Serialize,Debug)]#[serde(rename_all="camelCase")]
struct Place{lat:f64,lon:f64,house_level:bool,display_name:String}
fn parse_nominatim(text:&str)->Result<Option<Place>,String>{
 let v:serde_json::Value=serde_json::from_str(text).map_err(|_|"Unexpected Nominatim response.")?;let Some(p)=v.get(0) else{return Ok(None)};
 let s=|k:&str|p[k].as_str().unwrap_or("");let num=|k:&str|s(k).parse::<f64>().ok().or(p[k].as_f64());let house=|t:&str|t=="house"||t=="building";
 let (Some(lat),Some(lon))=(num("lat"),num("lon")) else{return Ok(None)};
 Ok(Some(Place{lat,lon,house_level:house(s("addresstype"))||house(s("type"))||s("class")=="building",display_name:s("display_name").into()}))
}
#[tauri::command]
async fn geocode_nominatim(query:String)->Result<Option<Place>,String>{
 let q=query.trim();if q.is_empty()||q.len()>300{return Err("Invalid address query.".into())}
 let url=reqwest::Url::parse_with_params("https://nominatim.openstreetmap.org/search",&[("format","jsonv2"),("limit","1"),("countrycodes","us"),("q",q)]).map_err(|e|e.to_string())?;
 throttle(&NOMINATIM_SLOT,Duration::from_millis(1100)).await;
 let r=api_client()?.get(url).send().await.map_err(net)?;
 if !r.status().is_success(){return Err(format!("Nominatim returned HTTP {}.",r.status().as_u16()))}
 parse_nominatim(&r.text().await.map_err(net)?)
}
fn with_season<T>(store:&Store,f:impl FnOnce(&mut Connection)->Result<T,String>)->Result<T,String>{let mut g=store.0.lock().map_err(|_|"Season is busy.")?;let s=g.as_mut().ok_or("No encrypted season is open.")?;f(&mut s.conn)}
#[derive(Serialize,Debug,PartialEq)]
struct Asset{mime:String,data:String}
fn put_asset(c:&Connection,bytes:&[u8],mime:&str)->Result<String,String>{if mime.is_empty()||mime.len()>100||!mime.chars().all(|c|c.is_ascii_graphic()){return Err("Invalid asset type.".into())}let hash=hex::encode(Sha256::digest(bytes));c.execute("INSERT OR IGNORE INTO asset(hash,mime,bytes,data,created_at) VALUES(?1,?2,?3,?4,datetime('now'))",params![hash,mime,bytes.len() as i64,bytes]).map_err(|e|e.to_string())?;Ok(hash)}
fn get_asset(c:&Connection,hash:&str)->Result<Option<Asset>,String>{c.query_row("SELECT mime,data FROM asset WHERE hash=?1",[hash],|r|Ok(Asset{mime:r.get(0)?,data:B64.encode(r.get::<_,Vec<u8>>(1)?)})).optional().map_err(|e|e.to_string())}
fn prune_assets(c:&mut Connection,keep:&[String])->Result<u32,String>{
 let keep:HashSet<&str>=keep.iter().map(String::as_str).collect();let tx=c.transaction().map_err(|e|e.to_string())?;
 let all:Vec<String>={let mut st=tx.prepare("SELECT hash FROM asset").map_err(|e|e.to_string())?;let rows=st.query_map([],|r|r.get(0)).map_err(|e|e.to_string())?;rows.collect::<Result<_,_>>().map_err(|e|e.to_string())?};
 let mut n=0;for h in all.iter().filter(|h|!keep.contains(h.as_str())){n+=tx.execute("DELETE FROM asset WHERE hash=?1",[h]).map_err(|e|e.to_string())? as u32;}
 tx.commit().map_err(|e|e.to_string())?;Ok(n)
}
#[tauri::command(async)]
fn asset_put(data:String,mime:String,store:tauri::State<Store>)->Result<String,String>{let bytes=b64(&data)?;with_season(&store,|c|put_asset(c,&bytes,&mime))}
#[tauri::command(async)]
fn asset_get(hash:String,store:tauri::State<Store>)->Result<Option<Asset>,String>{with_season(&store,|c|get_asset(c,&hash))}
#[tauri::command(async)]
fn asset_prune(keep:Vec<String>,store:tauri::State<Store>)->Result<u32,String>{with_season(&store,|c|prune_assets(c,&keep))}
#[tauri::command(async)]
fn vacuum_season(store:tauri::State<Store>)->Result<(),String>{let g=store.0.lock().map_err(|_|"Season is busy.")?;let s=g.as_ref().ok_or("No encrypted season is open.")?;s.conn.execute_batch("VACUUM;").map_err(|e|e.to_string())?;publish(s)}
fn packet_ok(data:&str)->Result<(),String>{let v:serde_json::Value=serde_json::from_str(data).map_err(|_|"Invalid packet data.")?;if v["kind"]!="opsanta-packet"{return Err("Unsupported packet format.".into())}Ok(())}
// Packets are built and read inside app data, so SQLite's journal never appears beside the user's file (App Store sandbox).
fn scratch_in(root:&Path)->PathBuf{root.join(format!("packet-{}.tmp",rand::random::<u64>()))}
fn drop_scratch(p:&Path){for ext in ["","-journal"]{let _=fs::remove_file(format!("{}{ext}",p.display()));}}
fn write_packet(path:&Path,pass:&str,data:&str,root:&Path)->Result<(),String>{
 packet_ok(data)?;if path.exists(){return Err("A file already exists at this location. Choose a new name.".into())}
 let tmp=scratch_in(root);let r=keyed(&tmp,pass,true).and_then(|c|{c.execute_batch("PRAGMA journal_mode=DELETE; PRAGMA secure_delete=ON; CREATE TABLE packet_state(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL); PRAGMA user_version=1;").map_err(|e|e.to_string())?;c.execute("INSERT INTO packet_state(id,data) VALUES(1,?1)",[data]).map_err(|e|e.to_string())?;Ok(())}).and_then(|_|fs::copy(&tmp,path).map(|_|()).map_err(|_|"Unable to write the packet file.".to_string()));
 drop_scratch(&tmp);if r.is_err(){let _=fs::remove_file(path);}r
}
fn read_packet(path:&Path,pass:&str,root:&Path)->Result<String,String>{if !path.is_file(){return Err("Packet file not found.".into())}let tmp=scratch_in(root);fs::copy(path,&tmp).map_err(|_|"Unable to read the packet file.")?;let r=keyed(&tmp,pass,false).and_then(|c|{let data:String=c.query_row("SELECT data FROM packet_state WHERE id=1",[],|r|r.get(0)).map_err(|_|"This is not an Operation Santa packet.")?;packet_ok(&data)?;Ok(data)});drop_scratch(&tmp);r}
#[tauri::command(async)]
fn export_packet(path:String,mut passphrase:String,data:String,app:tauri::AppHandle)->Result<(),String>{let root=seasons_root(&app)?;let r=write_packet(Path::new(&path),&passphrase,&data,&root);passphrase.zeroize();r}
#[tauri::command(async)]
fn open_packet(path:String,mut passphrase:String,app:tauri::AppHandle)->Result<String,String>{let root=seasons_root(&app)?;let r=read_packet(Path::new(&path),&passphrase,&root);passphrase.zeroize();r}
fn export_ext_ok(p:&Path)->bool{p.extension().and_then(|e|e.to_str()).is_some_and(|e|["pdf","csv","json","txt","md","docx","zip"].contains(&e.to_ascii_lowercase().as_str()))}
#[tauri::command(async)]
fn write_export(path:String,data:String)->Result<(),String>{let p=PathBuf::from(path);if !p.is_absolute()||!export_ext_ok(&p){return Err("Exports can only be saved as PDF, CSV, JSON, TXT, MD, DOCX, or ZIP files.".into())}fs::write(&p,b64(&data)?).map_err(|_|"Unable to write the export file.")?;Ok(())}
// E2E builds write panics, with a backtrace, to the file CI uploads: on Windows a panic inside a webview callback
// ends the app without a trace, and several runs lost the app mid-test.
#[cfg(feature="e2e")]
fn record_panics(){let Ok(path)=std::env::var("OPSANTA_E2E_LOG") else {return};let previous=std::panic::take_hook();std::panic::set_hook(Box::new(move|info|{use std::io::Write;if let Ok(mut f)=OpenOptions::new().create(true).append(true).open(&path){let _=writeln!(f,"[{:?}] {info}\n{}",std::thread::current().name(),std::backtrace::Backtrace::force_capture());}previous(info)}));}
#[cfg(all(debug_assertions,feature="e2e",target_os="macos"))]
fn keep_drawing(app:&tauri::App)->tauri::Result<()>{use tauri::Manager;use objc2::{class,msg_send,sel,runtime::AnyObject};if let Some(w)=app.get_webview_window("main"){w.with_webview(|v|unsafe{let wk=v.inner() as *mut AnyObject;let known:bool=msg_send![wk,respondsToSelector:sel!(_setWindowOcclusionDetectionEnabled:)];let win:*mut AnyObject=msg_send![wk,window];if !known||win.is_null(){return}let _:()=msg_send![wk,_setWindowOcclusionDetectionEnabled:false];let center:*mut AnyObject=msg_send![class!(NSNotificationCenter),defaultCenter];let name:*mut AnyObject=msg_send![class!(NSString),stringWithUTF8String:c"NSWindowDidChangeOcclusionStateNotification".as_ptr()];let _:()=msg_send![center,postNotificationName:name,object:win];})?;}Ok(())}
fn main(){#[cfg(feature="e2e")]record_panics();let builder=tauri::Builder::default();
 #[cfg(all(debug_assertions,feature="e2e"))]
 let builder=builder.plugin(tauri_plugin_wdio_webdriver::init()).plugin(tauri_plugin_wdio::init());
 // WebKit stops drawing a window that macOS reports as covered, as on a Mac someone is using during a run. The page
 // then reads as hidden and gets no animation frames, so the families table never mounts the rows scrolled to and the
 // E2E fails on a list that works for anyone looking at it. E2E builds keep drawing; every other build keeps WebKit's
 // power saving. WebKit decides visibility once the view is in its window, before setup runs, and rechecks only when
 // the window's occlusion changes, so the switch is followed by that notification.
 // The switch is private WebKit API, so it is skipped if a macOS release drops it.
 #[cfg(feature="updater")]
 let builder=builder.plugin(tauri_plugin_updater::Builder::new().build());
 let builder=builder.setup(|app|{identity_setup(app);#[cfg(target_os="macos")]{let menu=app_menu(app)?;app.set_menu(menu)?;app.on_menu_event(|app,e|{use tauri::Emitter;let _=app.emit_to("main","menu",e.id().0.clone());});}#[cfg(all(debug_assertions,feature="e2e",target_os="macos"))]keep_drawing(app)?;Ok(())});
 builder.plugin(tauri_plugin_dialog::init()).plugin(tauri_plugin_opener::init()).on_window_event(|w,e|{use tauri::Manager;if let tauri::WindowEvent::CloseRequested{..}=e{if *IN_WORKSPACE.lock().unwrap_or_else(|e|e.into_inner()){if let Some(w)=w.app_handle().get_webview_window(w.label()){save_frame(&w);}}}}).manage(Store::default()).invoke_handler(tauri::generate_handler![open_map,create_season,open_season,save_season,backup_season,close_season,fetch_attachment,airtable_get,secret_set,secret_get,secret_delete,geocode_census,geocode_nominatim,asset_put,asset_get,asset_prune,vacuum_season,purge_backups,restart_app,updater_built_in,app_identity,open_guide,window_mode,season_access,install_location,move_to_applications,export_packet,open_packet,write_export]).run(tauri::generate_context!()).expect("Unable to launch Operation Santa");}
#[cfg(test)] mod tests {use super::*;
#[test]fn move_to_applications_only_from_download_places(){
 let (apps,home)=(Path::new("/Applications"),Path::new("/Users/pat"));
 let at=|p:&str|misplaced(Path::new(p),apps,home);
 assert_eq!(at("/Applications/Operation Santa.app"),None);assert_eq!(at("/Users/pat/Applications/Operation Santa.app"),None);
 assert_eq!(at("/Volumes/Operation Santa/Operation Santa.app"),Some("a disk image"));
 assert_eq!(at("/private/var/folders/xy/T/AppTranslocation/1234-ABCD/d/Operation Santa.app"),Some("a temporary copy"));
 assert_eq!(at("/Users/pat/Downloads/Operation Santa.app"),Some("Downloads"));assert_eq!(at("/Users/pat/Desktop/Operation Santa.app"),Some("Desktop"));
 assert_eq!(at("/Users/pat/code/op-santa-app/target/release/bundle/macos/Operation Santa.app"),None);
}
#[cfg(target_os="macos")]#[test]fn move_bundle_copies_trashes_the_old_copy_and_the_original(){
 let root=std::env::temp_dir().join(format!("opsanta-move-{}",rand::random::<u64>()));let (dl,apps,trash)=(root.join("Downloads"),root.join("Applications"),root.join("Trash"));
 let app=|dir:&Path,body:&str|{let m=dir.join("Operation Santa.app/Contents/MacOS");fs::create_dir_all(&m).unwrap();fs::write(m.join("opsanta"),body).unwrap();dir.join("Operation Santa.app")};
 let src=app(&dl,"new");app(&apps,"old");
 let dest=move_bundle(&src,&apps,&trash).unwrap();
 assert_eq!(fs::read_to_string(dest.join("Contents/MacOS/opsanta")).unwrap(),"new");
 assert!(!src.exists(),"the original went to the Trash");
 let trashed:Vec<String>=fs::read_dir(&trash).unwrap().map(|e|e.unwrap().file_name().to_string_lossy().into_owned()).collect();
 assert_eq!(trashed.len(),2);assert!(trashed.iter().any(|n|n.starts_with("Operation Santa (replaced")));assert!(trashed.iter().any(|n|n.starts_with("Operation Santa (moved to Applications")));
 let old=trash.join(trashed.iter().find(|n|n.contains("replaced")).unwrap());assert_eq!(fs::read_to_string(old.join("Contents/MacOS/opsanta")).unwrap(),"old");
 fs::remove_dir_all(root).unwrap();
}#[test]fn encrypted_roundtrip(){let p=std::env::temp_dir().join(format!("opsanta-{}.opsanta",rand::random::<u64>()));{let c=connection(&p,"a test passphrase",true).unwrap();c.execute("INSERT INTO season_state VALUES(1,?1)",["private synthetic family"]).unwrap();}let bytes=fs::read(&p).unwrap();assert!(!bytes.windows(7).any(|w|w==b"private"));assert!(!bytes.starts_with(b"SQLite format 3"));assert!(connection(&p,"incorrect password",false).is_err());let c=connection(&p,"a test passphrase",false).unwrap();let text:String=c.query_row("SELECT data FROM season_state",[],|r|r.get(0)).unwrap();assert_eq!(text,"private synthetic family");drop(c);fs::remove_file(p).unwrap();}
fn tmp(ext:&str)->PathBuf{std::env::temp_dir().join(format!("opsanta-{}.{ext}",rand::random::<u64>()))}
#[test]fn attachment_allowlist(){
 let ok=|s:&str|allowed_url(&reqwest::Url::parse(s).unwrap());
 assert!(ok("https://v5.airtableusercontent.com/v3/u/1/abc/def"));assert!(ok("https://dl.airtable.com/.attachments/x.png"));assert!(ok("https://airtable.com/x"));assert!(ok("https://AIRTABLEUSERCONTENT.com/x"));
 assert!(!ok("http://v5.airtableusercontent.com/x"));assert!(!ok("https://airtableusercontent.com.evil.com/x"));assert!(!ok("https://evilairtable.com/x"));assert!(!ok("https://example.com/airtable.com"));assert!(!ok("https://airtable.com:8443/x"));assert!(!ok("https://user@airtable.com/x"));assert!(!ok("ftp://airtable.com/x"));
}
#[test]fn map_urls_carry_only_the_address(){assert_eq!(map_url("100 N Garfield Ave, Pasadena, CA 91101").unwrap(),"https://www.google.com/maps/search/?api=1&query=100+N+Garfield+Ave%2C+Pasadena%2C+CA+91101");assert!(map_url("").is_err());assert!(map_url("a\nb").is_err());assert!(map_url(&"x".repeat(201)).is_err());}
#[test]fn airtable_paths(){assert!(valid_airtable_path("appABC123/tblXYZ?offset=itr1%2Frec2&pageSize=100"));assert!(valid_airtable_path("appABC/tblXYZ/recQ1"));assert!(!valid_airtable_path("appA/../meta"));assert!(!valid_airtable_path("https://evil.com"));assert!(!valid_airtable_path("appA/tbl#x"));assert!(!valid_airtable_path("appA tbl"));}
#[test]fn census_parsing(){
 let text="\"1\",\"100 Main St, Pasadena, CA, 91101\",\"Match\",\"Exact\",\"100 MAIN ST, PASADENA, CA, 91101\",\"-118.14,34.14\",\"123\",\"L\"\n\"2\",\"1 Nowhere Rd, Pasadena, CA, 91101\",\"No_Match\"\n\"3\",\"5 Elm St, Pasadena, CA, 91101\",\"Match\",\"Non_Exact\",\"5 ELM ST, PASADENA, CA, 91101\",\"-118.1,34.2\",\"9\",\"R\"\n\"4\",\"7 Oak St, Pasadena, CA, 91101\",\"Tie\"\n";
 let h=parse_census(text);assert_eq!(h.len(),4);
 assert_eq!(h["1"],CensusHit{id:"1".into(),matched:true,exact:true,lat:Some(34.14),lon:Some(-118.14),matched_address:"100 MAIN ST, PASADENA, CA, 91101".into()});
 assert!(!h["2"].matched&&h["2"].lat.is_none()&&h["2"].matched_address.is_empty());assert!(h["3"].matched&&!h["3"].exact);assert!(!h["4"].matched);
 let rows=[CensusRow{id:"9".into(),street:"12 \"A\" St, Apt 3".into(),city:"Pasadena".into(),state:"CA".into(),zip:"91101".into()}];
 assert_eq!(String::from_utf8(census_csv(&rows).unwrap()).unwrap(),"9,\"12 \"\"A\"\" St, Apt 3\",Pasadena,CA,91101\n");
}
#[test]fn census_rows_refuse_extra_fields(){assert!(serde_json::from_str::<CensusRow>(r#"{"id":"1","street":"1 A St","city":"Pasadena","state":"CA","zip":"91101"}"#).is_ok());assert!(serde_json::from_str::<CensusRow>(r#"{"id":"1","street":"1 A St","city":"Pasadena","state":"CA","zip":"91101","name":"Secret Family"}"#).is_err());}
#[test]fn nominatim_parsing(){
 let p=parse_nominatim(r#"[{"lat":"34.1","lon":"-118.1","class":"place","type":"house","addresstype":"place","display_name":"100, Main Street"}]"#).unwrap().unwrap();assert!(p.house_level&&p.lat==34.1&&p.lon==-118.1);
 assert!(!parse_nominatim(r#"[{"lat":"34.1","lon":"-118.1","class":"highway","type":"residential","addresstype":"road","display_name":"Main Street"}]"#).unwrap().unwrap().house_level);
 assert!(parse_nominatim("[]").unwrap().is_none());
}
#[test]fn secret_names(){
 assert!(valid_secret("airtable_token"));assert!(!valid_secret("ors_key"),"the OpenRouteService key had no caller and was removed");assert!(valid_secret("passphrase:123e4567-e89b-12d3-a456-426614174000"));
 assert!(!valid_secret("passphrase:123E4567-E89B-12D3-A456-426614174000"));assert!(!valid_secret("passphrase:123e4567"));assert!(!valid_secret("passphrase:../../123e4567-e89b-12d3-a456-4266141740"));assert!(!valid_secret("other"));assert!(!valid_secret(""));
}
#[test]fn export_extensions(){assert!(export_ext_ok(Path::new("/x/route.PDF")));assert!(export_ext_ok(Path::new("/x/a.docx")));assert!(!export_ext_ok(Path::new("/x/a.opsanta")));assert!(!export_ext_ok(Path::new("/x/a")));assert!(!export_ext_ok(Path::new("/x/a.sh")));}
// App Store sandbox (and synced folders): a season may touch only the one file the user chose.
fn season_dirs()->(PathBuf,PathBuf){let base=std::env::temp_dir().join(format!("opsanta-season-{}",rand::random::<u64>()));let (dir,root)=(base.join("chosen"),base.join("appdata"));fs::create_dir_all(&dir).unwrap();fs::create_dir_all(&root).unwrap();(dir,root)}
fn listing(dir:&Path)->Vec<String>{if !dir.exists(){return vec![]}let mut v=fs::read_dir(dir).unwrap().filter_map(Result::ok).map(|e|e.file_name().to_string_lossy().into_owned()).collect::<Vec<_>>();v.sort();v}
const PASS:&str="a test passphrase";
fn season_json(tag:&str)->String{format!(r#"{{"schema":1,"families":[],"routes":[],"tag":"{tag}"}}"#)}
fn read_file_data(path:&Path)->String{decrypt_data(&fs::read(path).unwrap())}
fn decrypt_data(bytes:&[u8])->String{let copy=std::env::temp_dir().join(format!("opsanta-copy-{}.opsanta",rand::random::<u64>()));fs::write(&copy,bytes).unwrap();let c=keyed(&copy,PASS,false).unwrap();let d:String=c.query_row("SELECT data FROM season_state WHERE id=1",[],|r|r.get(0)).unwrap();drop(c);let _=fs::remove_file(&copy);d}
#[test]fn season_touches_only_its_own_file(){let (dir,root)=season_dirs();let path=dir.join("Season.opsanta");let mut s=create_in(&path,PASS,&season_json("v1"),&root).unwrap();save_to(&mut s,&season_json("v2")).unwrap();backup_of(&s).unwrap();assert_eq!(listing(&dir),vec!["Season.opsanta"],"while open");close_out(s).unwrap();assert_eq!(listing(&dir),vec!["Season.opsanta"],"after closing");let (s,_)=open_in(&path,PASS,&root).unwrap();assert_eq!(listing(&dir),vec!["Season.opsanta"],"after reopening");close_out(s).unwrap();}
#[test]fn season_file_is_complete_after_every_save(){let (dir,root)=season_dirs();let path=dir.join("Season.opsanta");let mut s=create_in(&path,PASS,&season_json("v1"),&root).unwrap();save_to(&mut s,&season_json("v2")).unwrap();assert!(decrypt_data(&read_through(&s.file).unwrap()).contains("v2"),"the file itself holds the latest save mid-session");close_out(s).unwrap();}
#[test]fn backups_go_to_app_data(){let (dir,root)=season_dirs();let path=dir.join("Season.opsanta");let s=create_in(&path,PASS,&season_json("v1"),&root).unwrap();let b=backup_of(&s).unwrap();assert!(b.starts_with(&root),"backup at {b:?} should be under {root:?}");assert!(read_file_data(&b).contains("v1"));close_out(s).unwrap();}
#[test]fn reopen_sees_the_last_save(){let (dir,root)=season_dirs();let path=dir.join("Season.opsanta");let mut s=create_in(&path,PASS,&season_json("v1"),&root).unwrap();save_to(&mut s,&season_json("v2")).unwrap();close_out(s).unwrap();let (s,data)=open_in(&path,PASS,&root).unwrap();assert!(data.contains("v2"));assert!(open_in(&path,PASS,&root).is_err(),"a second open of the same season is refused");close_out(s).unwrap();}
#[test]fn a_save_that_never_reached_the_file_is_recovered(){let (dir,root)=season_dirs();let path=dir.join("Season.opsanta");let s=create_in(&path,PASS,&season_json("v1"),&root).unwrap();
 // Simulate a crash after the database committed but before the file was rewritten.
 s.conn.execute("UPDATE season_state SET data=?1 WHERE id=1",[season_json("v2-unpublished")]).unwrap();drop(s);assert!(read_file_data(&path).contains("v1"));let (s,data)=open_in(&path,PASS,&root).unwrap();assert!(data.contains("v2-unpublished"),"the working copy's newer save is used");assert!(decrypt_data(&read_through(&s.file).unwrap()).contains("v2-unpublished"),"and written back to the file");close_out(s).unwrap();}
#[test]fn a_file_replaced_outside_the_app_wins(){let (dir,root)=season_dirs();let path=dir.join("Season.opsanta");let mut s=create_in(&path,PASS,&season_json("v1"),&root).unwrap();let old=backup_of(&s).unwrap();save_to(&mut s,&season_json("v2")).unwrap();s.conn.execute("UPDATE season_state SET data=?1 WHERE id=1",[season_json("v3-unpublished")]).unwrap();drop(s);
 // The coordinator restores last week's backup over the season file.
 fs::copy(&old,&path).unwrap();let (s,data)=open_in(&path,PASS,&root).unwrap();assert!(data.contains("v1"),"the restored file is what opens, not the stale working copy: {data}");close_out(s).unwrap();}
#[test]fn purging_backups_leaves_none_for_this_season(){let (dir,root)=season_dirs();let path=dir.join("Season.opsanta");let s=create_in(&path,PASS,&season_json("v1"),&root).unwrap();backup_of(&s).unwrap();backup_of(&s).unwrap();let other=create_in(&dir.join("Other.opsanta"),PASS,&season_json("x"),&root).unwrap();backup_of(&other).unwrap();assert_eq!(purge_backups_of(&s).unwrap(),2);assert!(listing(&root.join("backups").join(key_of(&path))).is_empty(),"no backups left for the purged season");assert_eq!(listing(&root.join("backups").join(key_of(&dir.join("Other.opsanta")))).len(),1,"other seasons' backups are untouched");close_out(s).unwrap();close_out(other).unwrap();}
#[test]fn packet_roundtrip(){
 let (dir,root)=season_dirs();let p=dir.join("Cleanup.opsanta-packet");let data=r#"{"kind":"opsanta-packet","rows":[{"note":"synthetic cleanup row"}]}"#;
 assert!(write_packet(&p,"a test passphrase",r#"{"kind":"season"}"#,&root).is_err());assert!(!p.exists());
 write_packet(&p,"a test passphrase",data,&root).unwrap();assert!(write_packet(&p,"a test passphrase",data,&root).is_err());
 let bytes=fs::read(&p).unwrap();assert!(!bytes.windows(9).any(|w|w==b"synthetic"));
 assert!(read_packet(&p,"incorrect password",&root).is_err());assert_eq!(read_packet(&p,"a test passphrase",&root).unwrap(),data);
 assert_eq!(listing(&dir),vec!["Cleanup.opsanta-packet"],"nothing beside the packet");assert!(listing(&root).is_empty(),"no scratch files left in app data: {:?}",listing(&root));
}
#[test]fn asset_roundtrip(){
 let p=tmp("opsanta");let mut c=connection(&p,"a test passphrase",true).unwrap();
 let a=put_asset(&c,b"synthetic drawing bytes","image/jpeg").unwrap();let b=put_asset(&c,b"other synthetic bytes","image/png").unwrap();
 assert_eq!(a,hex::encode(Sha256::digest(b"synthetic drawing bytes")));assert_eq!(put_asset(&c,b"synthetic drawing bytes","image/jpeg").unwrap(),a);assert!(put_asset(&c,b"x","").is_err());
 assert_eq!(get_asset(&c,&a).unwrap(),Some(Asset{mime:"image/jpeg".into(),data:B64.encode(b"synthetic drawing bytes")}));assert_eq!(get_asset(&c,"missing").unwrap(),None);
 assert_eq!(prune_assets(&mut c,std::slice::from_ref(&a)).unwrap(),1);assert!(get_asset(&c,&b).unwrap().is_none());assert!(get_asset(&c,&a).unwrap().is_some());
 c.execute_batch("VACUUM; PRAGMA wal_checkpoint(TRUNCATE);").unwrap();drop(c);
 let bytes=fs::read(&p).unwrap();assert!(!bytes.windows(9).any(|w|w==b"synthetic"));
 let c=connection(&p,"a test passphrase",false).unwrap();assert!(get_asset(&c,&a).unwrap().is_some());drop(c);
 for ext in ["","-wal","-shm"]{let _=fs::remove_file(format!("{}{ext}",p.display()));}
}
}
// Live contract checks against the real services (problems log B3). Ignored by default; run with `npm run live-check`.
// They send only public civic addresses (Pasadena City Hall, Pasadena City College) and one address that doesn't exist.
#[cfg(test)] mod live {use super::*;
 fn km(a:(f64,f64),b:(f64,f64))->f64{let r=std::f64::consts::PI/180.;let h=((b.0-a.0)*r/2.).sin().powi(2)+(a.0*r).cos()*(b.0*r).cos()*((b.1-a.1)*r/2.).sin().powi(2);6371.*2.*h.sqrt().asin()}
 const CITY_HALL:(f64,f64)=(34.1478,-118.1437);const PCC:(f64,f64)=(34.1449,-118.1180);
 #[test]#[ignore]fn live_census(){let rows=vec![CensusRow{id:"hall".into(),street:"100 N Garfield Ave".into(),city:"Pasadena".into(),state:"CA".into(),zip:"91101".into()},CensusRow{id:"pcc".into(),street:"1570 E Colorado Blvd".into(),city:"Pasadena".into(),state:"CA".into(),zip:"91106".into()},CensusRow{id:"none".into(),street:"99999 Nowhere Rd".into(),city:"Pasadena".into(),state:"CA".into(),zip:"91101".into()}];
  let out=tauri::async_runtime::block_on(geocode_census(rows)).expect("Census batch request failed");eprintln!("census: {out:?}");
  assert_eq!(out.iter().map(|h|h.id.as_str()).collect::<Vec<_>>(),["hall","pcc","none"],"one answer per row, in order");
  for (h,want) in [(&out[0],CITY_HALL),(&out[1],PCC)]{assert!(h.matched,"{} not matched",h.id);let d=km((h.lat.unwrap(),h.lon.unwrap()),want);assert!(d<0.6,"{} is {d:.2} km from where it should be",h.id);}
  assert!(!out[2].matched&&out[2].lat.is_none(),"a nonexistent address must come back unmatched");}
 #[test]#[ignore]fn live_nominatim(){let hit=tauri::async_runtime::block_on(geocode_nominatim("100 N Garfield Ave, Pasadena, CA 91101".into())).expect("Nominatim request failed").expect("Nominatim found nothing for Pasadena City Hall");eprintln!("nominatim: {hit:?}");let d=km((hit.lat,hit.lon),CITY_HALL);assert!(d<0.6,"Nominatim is {d:.2} km off");
  let none=tauri::async_runtime::block_on(geocode_nominatim("99999 Nowhere Rd, Pasadena, CA 91101".into())).expect("Nominatim request failed");eprintln!("nominatim nonexistent: {none:?}");assert!(none.as_ref().map_or(true,|p|!p.house_level),"a nonexistent address must not come back house-level");}
 // Needs the read-only token saved in Settings (keychain) plus OPSANTA_AIRTABLE_BASE and OPSANTA_AIRTABLE_TABLE.
 #[test]#[ignore]fn live_airtable(){let (Ok(base),Ok(table))=(std::env::var("OPSANTA_AIRTABLE_BASE"),std::env::var("OPSANTA_AIRTABLE_TABLE")) else{eprintln!("SKIPPED live_airtable: set OPSANTA_AIRTABLE_BASE and OPSANTA_AIRTABLE_TABLE, and save the token in Settings");return};
  let text=tauri::async_runtime::block_on(airtable_get(format!("{base}/{table}?maxRecords=3"))).expect("Airtable list failed");let v:serde_json::Value=serde_json::from_str(&text).expect("Airtable returned non-JSON");let records=v["records"].as_array().expect("no records array");assert!(!records.is_empty(),"table has no records");assert!(records[0]["fields"].get("Entry ID").is_some(),"records lack the Entry ID field the 2025 profile expects");
  let url=records.iter().flat_map(|r|r["fields"].as_object().into_iter().flatten()).filter_map(|(_,f)|f.as_array()).flatten().find_map(|a|a["url"].as_str().map(String::from));
  match url{Some(u)=>{let a=tauri::async_runtime::block_on(fetch_attachment(u)).expect("attachment download failed");assert_eq!(a.status,200,"fresh Airtable attachment link did not download");assert!(!a.data.is_empty());eprintln!("airtable attachment: {} ({} base64 chars)",a.content_type,a.data.len());}None=>eprintln!("no attachments in the first {} records; download not checked",records.len())}}
}

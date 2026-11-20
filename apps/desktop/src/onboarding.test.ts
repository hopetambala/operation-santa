import {describe,expect,it} from 'vitest';
import {addRecent,forgetRecent,parseRecents,syncedFolder,stepsDone,folderOf,fileName} from './onboarding';

describe('recent seasons',()=>{
  const r=(path:string,openedAt=1)=>({path,name:'Operation Santa 2026',openedAt});
  it('puts the newest first, keeps one row per file, and keeps six',()=>{
    let list=[r('/a.opsanta'),r('/b.opsanta')];
    list=addRecent(list,r('/b.opsanta',2));
    expect(list.map(x=>x.path)).toEqual(['/b.opsanta','/a.opsanta']);
    for(let i=0;i<10;i++)list=addRecent(list,r(`/s${i}.opsanta`));
    expect(list).toHaveLength(6);expect(list[0].path).toBe('/s9.opsanta');
  });
  it('forgets a season',()=>{expect(forgetRecent([r('/a'),r('/b')],'/a').map(x=>x.path)).toEqual(['/b']);});
  it('reads a damaged or foreign list as empty, never throws',()=>{
    expect(parseRecents(null)).toEqual([]);expect(parseRecents('not json')).toEqual([]);expect(parseRecents('{"a":1}')).toEqual([]);
    expect(parseRecents(JSON.stringify([{path:'/a',name:'x',openedAt:1},{path:3}]))).toHaveLength(1);
  });
  it('shows a short folder and the file name',()=>{
    expect(folderOf('/Users/pat/Documents/Santa/Operation Santa 2026.opsanta')).toBe('~/Documents/Santa');
    expect(fileName('/Users/pat/Documents/Operation Santa 2026.opsanta')).toBe('Operation Santa 2026.opsanta');
    expect(folderOf('C:\\Users\\pat\\Documents\\s.opsanta')).toBe('C:/Users/pat/Documents');
  });
});

describe('synced folders',()=>{
  it('names the service for iCloud Drive and the macOS CloudStorage providers',()=>{
    expect(syncedFolder('/Users/pat/Library/Mobile Documents/com~apple~CloudDocs/s.opsanta')).toBe('iCloud Drive');
    expect(syncedFolder('/Users/pat/Library/CloudStorage/Dropbox/s.opsanta')).toBe('Dropbox');
    expect(syncedFolder('/Users/pat/Library/CloudStorage/OneDrive-Personal/s.opsanta')).toBe('OneDrive');
    expect(syncedFolder('/Users/pat/Library/CloudStorage/GoogleDrive-pat@example.com/My Drive/s.opsanta')).toBe('Google Drive');
    expect(syncedFolder('C:\\Users\\pat\\OneDrive\\Documents\\s.opsanta')).toBe('OneDrive');
  });
  it('leaves local folders alone',()=>{
    expect(syncedFolder('/Users/pat/Documents/Operation Santa 2026.opsanta')).toBeNull();
    expect(syncedFolder('/Users/pat/Desktop/s.opsanta')).toBeNull();
  });
});

describe('step check marks',()=>{
  const none={families:0,importWork:0,routes:0,unrouted:0,children:0,pendingLetters:0,printed:0,stale:0};
  it('an empty season has no step done',()=>{expect(Object.values(stepsDone(none)).some(Boolean)).toBe(false);});
  it('a step is done when it had work and none is left',()=>{
    expect(stepsDone({...none,families:40,importWork:0,routes:3,unrouted:2,children:90,pendingLetters:0,printed:3,stale:1}))
      .toEqual({Import:true,Routes:false,Letters:true,Print:false});
  });
});

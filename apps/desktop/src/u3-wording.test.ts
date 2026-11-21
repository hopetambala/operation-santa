import {describe,expect,it} from 'vitest';
import {reviewReason,fieldLabel} from './model';
import {stepWork} from './onboarding';
// UX-HEURISTIC-REVIEW U3: the wording Hope approved on 2026-11-21.
const none={families:10,importWork:0,routes:2,unrouted:0,children:20,pendingLetters:0,printed:0,stale:0,printBlockers:0};
describe('U3 wording',()=>{
 it('Address review rows say why they need a look',()=>{expect(reviewReason({geo:'review',geoConfidence:.95})).toBe("Map wasn't sure (95%)");expect(reviewReason({geo:'review',geoConfidence:0})).toBe("Map wasn't sure");expect(reviewReason({geo:'failed',geoConfidence:0})).toBe('No match found');expect(reviewReason({geo:'pending',geoConfidence:0})).toBe('New since last import');});
 it('the import preview shows one plain label per field',()=>{expect(fieldLabel('Number of Children (#)')).toBe('Number of children');expect(fieldLabel('Number of Children')).toBe('Number of children');expect(fieldLabel('Child #3: First Choice')).toBe('Child 3: 1st choice');expect(fieldLabel('Child #2: Letter to Santa (Spanish to English translation)')).toBe('Child 2: letter translation');expect(fieldLabel('Contact Phone Number')).toBe('Contact phone number');});
 it('Print waits on steps 1–3 before the first print, then counts only its own problems',()=>{expect(stepWork({...none,pendingLetters:25,printBlockers:26}).Print).toBe('After steps 1–3');expect(stepWork({...none,importWork:5,printBlockers:5}).Print).toBe('After steps 1–3');expect(stepWork({...none,printBlockers:2}).Print).toBe('2 to fix');expect(stepWork(none).Print).toBe('Ready to print');expect(stepWork({...none,printed:2,pendingLetters:3,stale:1}).Print).toBe('1 to reprint');});
});

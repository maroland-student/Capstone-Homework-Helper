// local, one-session persistence for the saved equations


export interface SavedEquation {
    id: string;
    fromProblem: string;
    equation: string;
    substitutedEquation: string;
    variables: string[];
    savedAt: string;
    pinned: boolean;
}


// UI update stuff 
let saved: SavedEquation[] = [];
type Listener = (list: SavedEquation[]) => void;
let listeners = new Set<Listener>();

function notify() {
    for (const listen of listeners) {
        listen(saved);
    }
}


export function getSavedExtractedEquations() {
    return saved;
}

export function addSavedExtractedEquation(
    data: Omit<SavedEquation, 'id' | 'savedAt' | 'pinned'>
) 

{
    const entry: SavedEquation = {
        id: String(Date.now()),
        savedAt: new Date().toLocaleString(),
        pinned: false,
        ...data,
        };

        saved = [entry, ...saved];
        notify();
}

export function togglePinned(id: string) : void {
    let changed = false;
    const updated: SavedEquation[] = [];

    for (const item of saved) {
        if (item.id === id) {
            updated.push({ ...item, pinned: !item.pinned});
            changed = true;
        }

        else {
            updated.push(item);
        }
    }


    if (changed) {
        saved = updated;
        notify();
    }
}

 
export function removeSavedEquation(id: string) {
    saved = saved.filter(equ => equ.id !==id);
    notify();
}

export function clearSavedEquations() {
    saved =[];
    notify();
}

export function attachStudentListener(stu: Listener) {
    listeners.add(stu);
    stu(saved);

    return () => {
        listeners.delete(stu);
    }
    // NO finally case due to blocking of assignments ** TO FIX
    
}





// local, one-session persistence for the saved equations


export interface SavedEquation {
    id: string;
    fromProblem: string;
    equation: string;
    substitutedEquation: string;
    variables: string[];
    savedAt: string;
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
    data: Omit<SavedEquation, 'id' | 'savedAt'>
) 

{
    const entry: SavedEquation = {
        id: String(Date.now()),
        savedAt: new Date().toLocaleString(), ...data,
        };

        saved = [entry, ...saved];
        notify();
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





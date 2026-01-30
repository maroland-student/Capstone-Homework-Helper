
// A function to remove unsafe characters from user input
export function removeUnsafeCharacters(input: string): string {
    // Define a regex pattern to match unsafe characters
    const unsafePattern = /[<>\/\\'"]/g;
    
    // Replace unsafe characters with an empty string
    return input.replace(unsafePattern, '');
}

// A function to balance simple equations by ensuring they have an equals sign
export function balanceEquation(equation: string): string {
    // Split the equation into left and right parts
    const [left, right] = equation.split('=');
    if (!right) {
        // Missing equals sign, add 'y='
        return `y=${left}`;
    }

    return equation; // Equation is already balanced
}

// A function to check if a string has balanced parentheses
export function checkIsParensClosed(input: string): boolean {
    let count = 0;
    for (const char of input) {
        if (char === '(') {
            count++;
        } else if (char === ')') {
            count--;
            if (count < 0) {
                return false;
            }
        }
    }

    return count === 0;
}
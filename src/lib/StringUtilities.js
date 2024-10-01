class StringUtilities{
    getRandomChars(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Funzione per camuffare una stringa con più caratteri casuali
    obfuscateString(input, numRandomChars = 3) {
        let camouflaged = "$smlw.";  // Inizia la stringa camuffata con il prefisso "$smlw."
        
        // Inseriamo più caratteri casuali in posizioni fisse
        for (let i = 0; i < input.length; i++) {
            camouflaged += getRandomChars(numRandomChars) + input[i];
        }

        return camouflaged;
    }

// Funzione per riportare la stringa al valore originale
    deobfuscateString(camouflaged, numRandomChars = 3) {
        // Rimuoviamo il prefisso "$smlw."
        let cleanString = camouflaged.slice(6); // Saltiamo i primi 6 caratteri del prefisso
        
        let originalString = '';
        
        // Rimuoviamo i caratteri casuali nelle posizioni fisse
        for (let i = 0; i < cleanString.length; i += numRandomChars + 1) {
            originalString += cleanString.charAt(i + numRandomChars);  // Prendiamo il carattere originale dopo i caratteri casuali
        }
        
        return originalString;
    }
}

module.exports = StringUtilities;
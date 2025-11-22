import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedText } from './themed-text';

interface LaTeXRendererProps {
  equation: string;
  style?: any;
}

// Convert LaTeX to readable text format with proper mathematical notation
function latexToText(latex: string): string {
  let text = latex.trim();
  
  // Remove LaTeX markers but preserve the content
  text = text.replace(/\\\(/g, '').replace(/\\\)/g, '');
  text = text.replace(/\\\[/g, '').replace(/\\\]/g, '');
  text = text.replace(/\$\$/g, '').replace(/\$/g, '');
  
  // Remove LaTeX environment commands (with and without backslashes)
  text = text.replace(/\\begin\{cases\}/gi, '');
  text = text.replace(/\\end\{cases\}/gi, '');
  text = text.replace(/begincases/gi, '');
  text = text.replace(/endcases/gi, '');
  text = text.replace(/\\begin\{array\}/gi, '');
  text = text.replace(/\\end\{array\}/gi, '');
  text = text.replace(/\\begin\{align\}/gi, '');
  text = text.replace(/\\end\{align\}/gi, '');
  text = text.replace(/\\begin\{equation\}/gi, '');
  text = text.replace(/\\end\{equation\}/gi, '');
  
  // Convert fractions: \frac{a}{b} → (a)/(b) or better format
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    // For simple fractions, show as fraction notation
    if (!num.includes('\\') && !den.includes('\\')) {
      return `${num}/${den}`;
    }
    return `(${num})/(${den})`;
  });
  
  // Convert square roots: \sqrt{x} → √(x)
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  text = text.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '$1√($2)');
  
  // Convert superscripts: x^{2} → x² or x^2 → x²
  text = text.replace(/\^\{([^}]+)\}/g, (match, exp) => {
    // Convert common superscripts to Unicode
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
      'n': 'ⁿ', 'i': 'ⁱ'
    };
    if (exp.length === 1 && superscripts[exp]) {
      return superscripts[exp];
    }
    return `^(${exp})`;
  });
  text = text.replace(/\^(\d+)/g, (match, num) => {
    const superscripts: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    if (num.length === 1 && superscripts[num]) {
      return superscripts[num];
    }
    return `^${num}`;
  });
  
  // Convert subscripts: x_{1} → x₁
  text = text.replace(/_\{([^}]+)\}/g, (match, sub) => {
    const subscripts: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎'
    };
    if (sub.length === 1 && subscripts[sub]) {
      return subscripts[sub];
    }
    return `_${sub}`;
  });
  text = text.replace(/_(\d+)/g, (match, num) => {
    const subscripts: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    if (num.length === 1 && subscripts[num]) {
      return subscripts[num];
    }
    return `_${num}`;
  });
  
  // Convert mathematical operators
  text = text.replace(/\\cdot/g, ' · ');
  text = text.replace(/\\times/g, ' × ');
  text = text.replace(/\\div/g, ' ÷ ');
  text = text.replace(/\\pm/g, ' ± ');
  text = text.replace(/\\mp/g, ' ∓ ');
  
  // Convert comparison operators
  text = text.replace(/\\leq/g, ' ≤ ');
  text = text.replace(/\\geq/g, ' ≥ ');
  text = text.replace(/\\neq/g, ' ≠ ');
  text = text.replace(/\\approx/g, ' ≈ ');
  text = text.replace(/\\equiv/g, ' ≡ ');
  
  // Convert Greek letters
  text = text.replace(/\\alpha/g, 'α');
  text = text.replace(/\\beta/g, 'β');
  text = text.replace(/\\gamma/g, 'γ');
  text = text.replace(/\\delta/g, 'δ');
  text = text.replace(/\\epsilon/g, 'ε');
  text = text.replace(/\\theta/g, 'θ');
  text = text.replace(/\\lambda/g, 'λ');
  text = text.replace(/\\mu/g, 'μ');
  text = text.replace(/\\pi/g, 'π');
  text = text.replace(/\\sigma/g, 'σ');
  text = text.replace(/\\phi/g, 'φ');
  text = text.replace(/\\omega/g, 'ω');
  
  // Convert other mathematical symbols
  text = text.replace(/\\sum/g, 'Σ');
  text = text.replace(/\\prod/g, '∏');
  text = text.replace(/\\int/g, '∫');
  text = text.replace(/\\infty/g, '∞');
  text = text.replace(/\\partial/g, '∂');
  
  // Clean up braces (but preserve spacing around operators)
  text = text.replace(/\{/g, '').replace(/\}/g, '');
  
  // Remove backslashes that aren't part of commands (shouldn't be any left)
  text = text.replace(/\\/g, '');
  
  // Clean up extra spaces but preserve spacing around operators
  text = text.replace(/\s+/g, ' ').trim();
  
  // Fix spacing around =, +, -, etc. to make equations readable
  text = text.replace(/\s*=\s*/g, ' = ');
  text = text.replace(/\s*\+\s*/g, ' + ');
  text = text.replace(/\s*-\s*/g, ' - ');
  text = text.replace(/\s*\*\s*/g, ' · ');
  
  return text;
}

export function LaTeXRenderer({ equation, style }: LaTeXRendererProps) {
  const textEquation = latexToText(equation);
  
  // Display as formatted text (works on all platforms)
  return (
    <View style={[styles.container, style]}>
      <ThemedText style={styles.equationText}>
        {textEquation}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 60,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  equationText: {
    fontSize: 18,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'monospace',
      default: 'monospace',
    }),
    textAlign: 'center',
    fontWeight: '500',
  },
});


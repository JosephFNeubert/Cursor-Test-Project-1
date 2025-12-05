const { useState, useRef, useEffect } = React;
//const math = require('mathjs');

// Verify MathJS is loaded and log available functions (for debugging)
if (typeof math !== 'undefined') {
    console.log('MathJS loaded successfully');
    console.log('Available functions:', {
        derivative: typeof math.derivative,
        parse: typeof math.parse,
        simplify: typeof math.simplify,
        evaluate: typeof math.evaluate
    });
} else {
    console.error('MathJS is not loaded!');
}

// List of extra calculus/math symbols for the keyboard
const SYMBOLS = [
    { label: '∫', value: '∫' },
    { label: 'd/dx', value: 'd/dx ' },
    { label: 'dx', value: 'dx' },
    { label: 'dy', value: 'dy' },
    { label: '∂', value: '∂' },
    { label: '∞', value: '∞' },
    { label: 'π', value: 'π' },
    { label: '√', value: '√' },
    { label: '^', value: '^' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: 'e', value: 'e' },
    { label: 'sin', value: 'sin' },
    { label: 'cos', value: 'cos' },
    { label: 'tan', value: 'tan' },
    { label: 'ln', value: 'ln' },
    { label: 'log', value: 'log' }
];

function DifferentialIntegralSolver() {
    const [input, setInput] = useState('');
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [result, setResult] = useState('');
    const inputRef = useRef(null);

    // Insert symbol at the current cursor position
    const insertSymbol = (symbol) => {
        const el = inputRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newInput = input.slice(0, start) + symbol + input.slice(end);
        setInput(newInput);
        // After updating, return cursor to after inserted symbol
        setTimeout(() => {
            el.selectionStart = el.selectionEnd = start + symbol.length;
            el.focus();
        }, 0);
    };

    // Show keyboard when text field is focused
    const handleFocus = () => setShowKeyboard(true);

    // Hide keyboard when clicking outside of container
    useEffect(() => {
        const handleClick = (e) => {
            if (!inputRef.current) return;
            if (
                !inputRef.current.contains(e.target) &&
                !document.getElementById('calc-keyboard')?.contains(e.target)
            ) {
                setShowKeyboard(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Basic integration helper (handles common cases)
    const integrate = (expression, variable) => {
        try {
            // Parse the expression using MathJS
            const parsed = math.parse(expression);
            
            // Handle polynomial integration: x^n -> x^(n+1)/(n+1)
            if (parsed && parsed.type === 'OperatorNode' && parsed.op === '^') {
                const base = parsed.args[0];
                const exponent = parsed.args[1];
                if (base && base.type === 'SymbolNode' && base.name === variable) {
                    if (exponent && exponent.type === 'ConstantNode' && typeof exponent.value === 'number') {
                        const newExp = exponent.value + 1;
                        if (newExp === 0) {
                            return math.parse(`ln(${variable})`);
                        }
                        return math.parse(`(${variable}^${newExp})/${newExp}`);
                    }
                }
            }
            
            // Handle multiplication: c*x^n where c is constant
            if (parsed && parsed.type === 'OperatorNode' && parsed.op === '*') {
                const left = parsed.args[0];
                const right = parsed.args[1];
                // Check if one is constant and other is x^n
                if (left && left.type === 'ConstantNode' && right && right.type === 'OperatorNode' && right.op === '^') {
                    const base = right.args[0];
                    const exp = right.args[1];
                    if (base && base.type === 'SymbolNode' && base.name === variable && exp && exp.type === 'ConstantNode') {
                        const newExp = exp.value + 1;
                        const coeff = left.value;
                        if (newExp === 0) {
                            return math.parse(`${coeff} * ln(${variable})`);
                        }
                        return math.parse(`(${coeff} * ${variable}^${newExp})/${newExp}`);
                    }
                }
            }
            
            // Handle simple cases: x -> x^2/2
            if (parsed && parsed.type === 'SymbolNode' && parsed.name === variable) {
                return math.parse(`(${variable}^2)/2`);
            }
            
            // Handle constants multiplied by x: c*x -> c*x^2/2
            if (parsed && parsed.type === 'OperatorNode' && parsed.op === '*') {
                const left = parsed.args[0];
                const right = parsed.args[1];
                if ((left && left.type === 'ConstantNode' && right && right.type === 'SymbolNode' && right.name === variable) ||
                    (right && right.type === 'ConstantNode' && left && left.type === 'SymbolNode' && left.name === variable)) {
                    const coeff = left.type === 'ConstantNode' ? left.value : right.value;
                    return math.parse(`(${coeff} * ${variable}^2)/2`);
                }
            }
            
            // For unsupported cases, show a helpful message
            throw new Error(`Integration not yet supported for: ${expression}. Try: x, x^2, x^3, 2*x, etc.`);
        } catch (e) {
            throw e;
        }
    };

    // Use mathJS for parsing and solving calculus equations
    const solveInput = () => {
        // Attempt to parse ∫ and d/dx simple cases
        try {
            let expr = input.trim();
            if (expr.startsWith('∫')) {
                // Example: ∫ x^2 dx
                // Extract the inside of the integral
                let match = expr.match(/^∫\s*(.*?)\s*d([a-zA-Z])$/);
                if (match) {
                    const body = match[1].trim();
                    const variable = match[2];
                    
                    if (typeof math === 'undefined') {
                        setResult('Error: MathJS is not loaded. Please check your internet connection.');
                        return;
                    }
                    
                    if (typeof math.parse !== 'function') {
                        setResult('Error: MathJS parse function is not available. The browser build may be incomplete.');
                        return;
                    }
                    
                    try {
                        const integral = integrate(body, variable);
                        // Try to simplify if available, otherwise just convert to string
                        let result;
                        if (typeof math.simplify === 'function') {
                            result = math.simplify(integral).toString();
                        } else {
                            result = integral.toString();
                        }
                        setResult(result);
                    } catch (e) {
                        setResult('Error: ' + e.message);
                    }
                    return;
                } else {
                    setResult('Invalid integral format. Use: ∫ expression dx (e.g., ∫ x^2 dx)');
                    return;
                }
            } else if (expr.startsWith('d/d')) {
                // Example: d/dx x^2
                let match = expr.match(/^d\/d([a-zA-Z])\s+(.*)$/);
                if (match) {
                    const variable = match[1];
                    const body = match[2].trim();
                    
                    if (typeof math === 'undefined') {
                        setResult('Error: MathJS is not loaded. Please check your internet connection.');
                        return;
                    }
                    
                    if (typeof math.derivative !== 'function') {
                        setResult('Error: MathJS derivative function is not available.');
                        return;
                    }
                    
                    try {
                        const derivative = math.derivative(body, variable);
                        // Try to simplify if available, otherwise just convert to string
                        let result;
                        if (typeof math.simplify === 'function') {
                            result = math.simplify(derivative).toString();
                        } else {
                            result = derivative.toString();
                        }
                        setResult(result);
                    } catch (e) {
                        setResult('Error: ' + e.message);
                    }
                    return;
                } else {
                    setResult('Invalid derivative format. Use: d/dx expression (e.g., d/dx x^2)');
                    return;
                }
            } else {
                setResult('Please start your input with ∫ (for integral) or d/dx (for derivative).');
                return;
            }
        } catch (e) {
            setResult('Error: ' + e.message);
        }
    };

    return (
        <div style={{ position: 'relative', maxWidth: 500, margin: '40px auto', border: '1px solid #ccc', borderRadius: 8, padding: 24, boxShadow: '0 2px 12px #eee', background: 'white' }}>
            <h2>Calculus Equation Solver</h2>
            <div style={{ marginBottom: 16 }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onFocus={handleFocus}
                    style={{ width: '100%', fontSize: 20, padding: 10 }}
                    placeholder="Enter calculus equation, e.g. ∫ x^2 dx or d/dx x^2"
                    autoComplete="off"
                />
            </div>
            <button onClick={solveInput} style={{ fontSize: 18, padding: '8px 16px', marginBottom: 16 }}>
                Solve
            </button>
            <div style={{ minHeight: 40, fontSize: 21, color: '#1a3' }}>{result}</div>
            {showKeyboard && (
                <div
                    id="calc-keyboard"
                    style={{
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: 8,
                        background: '#f9f9f9',
                        borderTop: '1px solid #bbb',
                        boxShadow: '0 -2px 15px #ddd',
                        zIndex: 1000
                    }}
                >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {SYMBOLS.map(s => (
                            <button
                                key={s.label}
                                onClick={() => insertSymbol(s.value)}
                                style={{
                                    fontSize: 22,
                                    margin: 3,
                                    minWidth: 50,
                                    padding: '9px 0 8px 0',
                                    borderRadius: 7,
                                    border: '1px solid #aaa',
                                    background: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DifferentialIntegralSolver />);

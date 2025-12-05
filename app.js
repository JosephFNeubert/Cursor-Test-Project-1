const { useState, useRef, useEffect } = React;
const math = require('mathjs');

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
                    const body = match[1];
                    const variable = match[2];
                    // mathjs: integrate('x^2', 'x') => 1/3 x^3
                    if (typeof math !== 'undefined' && math.integral) {
                        setResult('' + math.integral(body, variable).toString());
                        return;
                    } else {
                        setResult('Integral solving requires MathJS with "integral" extension.');
                        return;
                    }
                }
            } else if (expr.startsWith('d/d')) {
                // Example: d/dx x^2
                let match = expr.match(/^d\/d([a-zA-Z])\s+(.*)$/);
                if (match) {
                    const variable = match[1];
                    const body = match[2];
                    if (typeof math !== 'undefined' && math.derivative) {
                        const d = math.derivative(body, variable);
                        setResult(d ? d.toString() : 'Error computing derivative');
                        return;
                    } else {
                        setResult('Differentiation requires MathJS.');
                        return;
                    }
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

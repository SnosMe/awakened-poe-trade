interface Operator {
    apply: Function;
    precedence: number;
}

const OPERATORS: Record<string, Operator> = {
    'u_+': {
        apply: (a: number) => a,
        precedence: 3
    },
    'u_-': {
        apply: (a: number) => -a,
        precedence: 3
    },
    '+': {
        apply: (a: number, b: number) => a + b,
        precedence: 1
    },
    '-': {
        apply: (a: number, b: number) => a - b,
        precedence: 1
    },
    '*': {
        apply: (a: number, b: number) => a * b,
        precedence: 2
    },
    '/': {
        apply: (a: number, b: number) => a / b,
        precedence: 2
    }
};

export default class MathParser {
    private values: number[] = [];
    private operators: string[] = [];

    private applyOperator(operator: string): number {
        const func = OPERATORS[operator].apply;

        if (func.length === 1) {
            return func(this.values.pop()!);
        } else {
            return func(...this.values.splice(-2));
        }
    }

    private hasPrecedence(op1: string, op2: string): boolean {
        return (OPERATORS[op1]?.precedence ?? 0) >= (OPERATORS[op2]?.precedence ?? 0);
    }

    private isUnary(op: string, prevToken: string): boolean {
        return (op === '-' || op === '+') && [...Object.keys(OPERATORS), '('].includes(prevToken);
    }

    private applyUntil(predicate: (op: string) => boolean) {
        while (this.operators.length && predicate(this.operators.at(-1)!)) {
            this.values.push(this.applyOperator(this.operators.pop()!));
        }
    }

    public evaluate(expression: string, units: Record<string, number> = {}): number {
        try {
            this.values = []
            this.operators = []
            const valuePattern = new RegExp(String.raw`^(?<num>\d+(?:\.\d+)?|\.\d+)(?<unit>(?:${Object.keys(units).join('|')})?)$`)
            const tokens = expression.replace(/\s/g, '').split(/(\+|\-|\*|\/|\(|\))/).filter(Boolean);

            let prevToken = '('
            let prevPrevToken = '('
            for (let token of tokens) {
                if (this.isUnary(token, prevToken)) {
                    token = `u_${token}`;
                    if (token == 'u_-' && prevToken == token) {
                        prevToken = prevPrevToken
                        this.operators.pop()!
                        continue
                    } else if (token == 'u_+') continue
                }

                if (token in OPERATORS) {
                    this.applyUntil(op => this.hasPrecedence(op, token));
                    this.operators.push(token);
                }
                else if (token === '(') {
                    this.operators.push(token);
                }
                else if (token === ')') {
                    this.applyUntil(op => op !== '(');
                    this.operators.pop();
                }
                else {
                    const { num, unit } = valuePattern.exec(token.toLowerCase())!.groups!
                    this.values.push(Number(num) * (units[unit] ?? 1))
                }
                prevPrevToken = prevToken
                prevToken = token
            }
            this.applyUntil(() => true);

            return this.values[0] ?? 0;
        } catch (error) {
            return NaN;
        }
    }
}
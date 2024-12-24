import { createSignal, JSX } from "solid-js";

export type CurrencyFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
    
};

export function CurrencyField(props: CurrencyFieldProps) {
    const styles = () => ({
        "p-2": true,
        "border-b-2": true,
        "border-june-bud": true,
        "text-xl": true,
        "w-[70%]": true,
        "focus:outline-none": true,
    });

    return (
        <input {...props} type="text" classList={styles()} inputMode="numeric" pattern="\\d+,?\\d{0,2}" />
    );
}
import { JSX } from "solid-js";

export type TextFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
    
};

export function TextField(props: TextFieldProps) {
    const styles = () => ({
        "p-2": true,
        "border-b-2": true,
        "border-june-bud": true,
        "text-xl": true,
        "w-[70%]": true,
        "focus:outline-none": true,
        //"border-red-600": props.invalid,
    });

    return (
        <input {...props} classList={styles()} />
    );
}
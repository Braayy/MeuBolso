import { createSignal, JSX, onCleanup, Signal } from "solid-js";
import { parseMonetaryAmountFromInput } from "../MonetaryAmount";

type FormProps = JSX.FormHTMLAttributes<HTMLFormElement> & {
    children: JSX.Element;
};

type FormInputControls<TFieldValue> = {
    value: TFieldValue;
};

type FormInputProps<TFieldName, TFieldValue> = {
    name: TFieldName;
    validation?: FieldValidator<TFieldValue>[],
    children: (field: FormInputControls<TFieldValue>) => JSX.Element;
};

type FieldError = {
    name: string;
    message: string | undefined;
};

type FormState = {
    submitting: boolean;
};

type CustomFormConfig<TFormSchema> = {
    onSubmit(values: TFormSchema): Promise<void>;
    onError(error: FieldError[] | string): Promise<void>;
};

type CustomFormCreator<TFormSchema> = [
    {
        submitting: boolean,
        setFieldValue<TFieldName extends keyof TFormSchema, TFieldValue extends TFormSchema[TFieldName]>(name: TFieldName, value: TFieldValue): void;
    },
    {
        Form(props: FormProps): JSX.Element;
        FormField<
            TFieldName extends keyof TFormSchema,
            TFieldValue extends TFormSchema[TFieldName]
        >(props: FormInputProps<TFieldName, TFieldValue>): JSX.Element;
    }
];

export function createCustomForm<TFormSchema extends Record<string, any>>(config: CustomFormConfig<TFormSchema>): CustomFormCreator<TFormSchema> {
    const [formState, setFormState] = createSignal<FormState>({
        submitting: false,
    });

    const fieldSignals: Record<any, Signal<TFormSchema[keyof TFormSchema]>> = {};

    const fieldValidators: Record<any, FieldValidator<TFormSchema[keyof TFormSchema]>[]> = {};

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        setFormState({
            submitting: true,
        });

        const values: Record<any, any> = {};
        for (const [name, signal] of Object.entries(fieldSignals)) {
            values[name] = signal[0]();
        }

        const errors: FieldError[] = [];
        for (const [name, validators] of Object.entries(fieldValidators)) {
            for (const validator of validators) {
                if (!validator.validate(values[name])) {
                    errors.push({ name, message: validator.message });
                }
            }
        }

        if (errors.length > 0) {
            config.onError(errors)
                .then(() => setFormState({
                    submitting: false,
                }));

            return;
        }

        config.onSubmit(values)
            .catch((err) => config.onError(err))
            .then(() => setFormState({
                submitting: false,
            }));
    }

    function getOrCreateFieldSignal<TFieldName extends keyof TFormSchema, TFieldValue extends TFormSchema[TFieldName]>(name: TFieldName): Signal<TFieldValue> {
        let signal = fieldSignals[name];
        if (signal) {
            return signal;
        }

        signal = createSignal<any>();
        fieldSignals[name] = signal;

        return signal;
    }

    return [
        {
            get submitting() {
                return formState().submitting;
            },

            setFieldValue<TFieldName extends keyof TFormSchema, TFieldValue extends TFormSchema[TFieldName]>(name: TFieldName, value: TFieldValue) {
                getOrCreateFieldSignal(name)[1](value);
            }
        },
        {
            Form: (props: FormProps) => (
                <form {...props} onSubmit={handleSubmit}>
                    {props.children}
                </form>
            ),
    
            FormField: <
                TFieldName extends keyof TFormSchema,
                TFieldValue extends TFormSchema[TFieldName]
            >(props: FormInputProps<TFieldName, TFieldValue>) => {
                if (props.validation) {
                    fieldValidators[props.name] = props.validation;
                }
    
                onCleanup(() => {
                    delete fieldSignals[props.name];
                    delete fieldValidators[props.name];
                });
    
                return (
                    props.children({
                        get value() {
                            return getOrCreateFieldSignal(props.name)[0]();
                        },
        
                        set value(value) {
                            getOrCreateFieldSignal(props.name)[1](value);
                        }
                    })
                );
            },
        }
    ];
}

export type FieldValidator<TFieldValue> = {
    message: string | undefined;
    validate(value: TFieldValue | undefined): boolean;
};

export function required<TFieldValue>(message?: string): FieldValidator<TFieldValue> {
    return {
        message,
        validate(value) {
            if (value === undefined || value === null) {
                return false;
            }
    
            if (typeof value === "string" && value === "") {
                return false;
            }
    
            if (typeof value === "number" && isNaN(value)) {
                return false;
            }

            return true;
        }
    };
}

export function pattern<TFieldValue extends string>(pattern: RegExp, message?: string): FieldValidator<TFieldValue> {
    return {
        message,
        validate(value) {
            return pattern.test(value as string);
        }
    };
}

export function custom<TFieldValue>(validate: FieldValidator<TFieldValue>["validate"], message?: string): FieldValidator<TFieldValue> {
    return {
        message,
        validate,
    };
}

export function monetaryAmount<TFieldValue extends string>(message?: string): FieldValidator<TFieldValue> {
    return {
        message,
        validate(value) {
            try {
                const amount = parseMonetaryAmountFromInput(value as string);

                return amount > 0n;
            } catch (err) {
                return false;
            }
        },
    };
}
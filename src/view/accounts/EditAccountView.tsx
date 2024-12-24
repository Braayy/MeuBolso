import { createForm, custom, pattern, required, reset, SubmitHandler } from "@modular-forms/solid";
import { RouteSectionProps, useNavigate } from "@solidjs/router";
import { createResource, For, Show } from "solid-js";
import { rxDatabase } from "../../database";
import { AccountDocument, AccountSchema, AccountType, AccountTypes } from "../../database/Account";
import { RxDocument } from "rxdb";
import { createEffect } from "solid-js";
import { formatMonetaryAmount, parseMonetaryAmountFromInput } from "../../MonetaryAmount";
import classNames from "classnames";
import { TextField } from "../../component/TextField";
import { CurrencyField } from "../../component/CurrencyField";
import { Select } from "../../component/Select";
import { Throbber } from "../../component/Throbber";

type EditAccountForm = {
    name: string;
    initialBalance: string;
    type: string;
};

export function EditAccountView(props: RouteSectionProps) {
    const navigate = useNavigate();
    const [form, { Form, Field }] = createForm<EditAccountForm>();
    
    const [accountDocument] = createResource(async () => {
        const doc = await rxDatabase.accounts.findOne({
            selector: {
                id: props.params.id,
            }
        }).exec();

        return doc as RxDocument<AccountDocument>;
    });

    createEffect(() => {
        const accountDoc = accountDocument();
        if (!accountDoc) return;

        const account = AccountSchema.parse(accountDoc._data);

        reset(form, ["name", "initialBalance", "type"], {
            initialValues: {
                name: account.name,
                initialBalance: formatMonetaryAmount(account.initialBalance),
                type: account.type,
            },
        });
    });

    const handleSubmit: SubmitHandler<EditAccountForm> = async (values) => {
        await accountDocument()?.patch({
            name: values.name,
            initialBalance: parseMonetaryAmountFromInput(values.initialBalance).toString(),
            type: values.type as AccountType,
        });

        navigate("/accounts");
    };

    const styles = () => classNames("flex flex-col justify-center items-center gap-4 h-full", {
        "blur": form.submitting,
    });

    return (
        <div class="relative h-full">
            <Form onSubmit={handleSubmit} class={styles()}>
                <h1 class="text-4xl font-bold text-center">Alterar {accountDocument()?._data?.name}</h1>

                <Field
                    name="name"
                    validate={[
                        required("Digite o nome da conta"),
                    ]}
                >
                    {(field, props) => (
                        <>
                            <TextField {...props} value={field.value} type="text" placeholder="Nome da Conta" />
                        </>
                    )}
                </Field>

                <Field
                    name="initialBalance"
                    validate={[
                        required("Digite o saldo inicial"),
                        pattern(/\d+,?\d{0,2}/, "Digite no formato correto"),
                    ]}
                >
                    {(field, props) => <CurrencyField {...props} value={field.value} type="text" placeholder="Saldo Inicial" />}
                </Field>

                <Field
                    name="type"
                    validate={[
                        custom((value) => !!value && AccountTypes.includes(value as any), "Escolha o tipo da conta"),
                    ]}
                >
                    {(field, props) => (
                        <Select {...props}>
                            <option disabled selected>Escolha o tipo da conta</option>
                            <For each={AccountTypes}>{(accountType) => (
                                <option value={accountType} selected={field.value === accountType}>{accountType}</option>
                            )}</For>
                        </Select>
                    )}
                </Field>

                <button type="submit" class="p-2 bg-june-bud text-xl rounded-lg">Alterar conta</button>
            </Form>
            <Show when={form.submitting}>
                <div class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]">
                    <Throbber size={50} />
                </div>
            </Show>
        </div>
    );
}
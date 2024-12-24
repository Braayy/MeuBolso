import { MonetaryAmountFromStringTransformer, MonetaryAmountToStringTransformer } from "../MonetaryAmount";
import { z } from "zod";

export const AccountTypeSchema = z.enum([
    "Ativo",
    "Passivo",
]);

export const AccountTypes = Object.values(AccountTypeSchema.Values);

export type AccountType = z.infer<typeof AccountTypeSchema>;

export const AccountSchema = z.object({
    id: z.string(),
    name: z.string(),
    initialBalance: MonetaryAmountFromStringTransformer,
    type: AccountTypeSchema,
});

export type Account = z.infer<typeof AccountSchema>;

export const AccountDocumentSchema = AccountSchema
    .extend({
        initialBalance: MonetaryAmountToStringTransformer,
    });

export type AccountDocument = z.infer<typeof AccountDocumentSchema>;

export const AccountCollectionSchema = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: {
            type: "string",
            maxLength: 40,
        },

        name: {
            type: "string",
        },
        
        initialBalance: {
            type: "string"
        },

        type: {
            type: "string",
        },
    },
    required: ["id", "name", "initialBalance"],
} as const;
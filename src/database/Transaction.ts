import { ExtractDocumentTypeFromTypedRxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { MonetaryAmountFromStringTransformer, MonetaryAmountToStringTransformer } from "../MonetaryAmount";
import { z } from "zod";
import dayjs, { Dayjs, isDayjs } from "dayjs";

const zDayjs = z.custom<Dayjs>((value) => isDayjs(value));

const DayjsFromStringTransformer = z.string().transform((value, ctx) => {
    const dayjsObj = dayjs(value);

    if (!dayjsObj.isValid()) {
        ctx.addIssue({
            code: "invalid_date",
            message: "Not a valid date for dayjs",
        });

        return z.NEVER;
    }

    return dayjsObj;
});

const DayjsToStringTransformer = zDayjs.transform((value) => value.format("YYYY-MM-DD"));

export const ExternalTransactionTypeSchema = z.enum([
    "Receita",
    "Despesa",
]);

export const ExternalTransactionTypes = Object.values(ExternalTransactionTypeSchema.Values);

export type ExternalTransactionType = z.infer<typeof ExternalTransactionTypeSchema>;

export const TransferTransactionSchema = z.object({
    id: z.string().uuid(),
    date: DayjsFromStringTransformer,
    description: z.string(),
    value: MonetaryAmountFromStringTransformer,
    fromId: z.string().uuid(),
    toId: z.string().uuid(),
});

export const ExternalTransactionSchema = z.object({
    id: z.string().uuid(),
    date: DayjsFromStringTransformer,
    description: z.string(),
    value: MonetaryAmountFromStringTransformer,
    accountId: z.string().uuid(),
    type: ExternalTransactionTypeSchema,
});

export const TransactionSchema = z.union([
    TransferTransactionSchema,
    ExternalTransactionSchema,
]);

export type TransferTransaction = z.infer<typeof TransferTransactionSchema>;

export type ExternalTransaction = z.infer<typeof ExternalTransactionSchema>;

export type Transaction = z.infer<typeof TransactionSchema>;

export function isTransferTransaction(transaction: Transaction): transaction is TransferTransaction {
    return "fromId" in transaction;
}

export function isExternalTransaction(transaction: Transaction): transaction is ExternalTransaction {
    return "accountId" in transaction;
}

export const TransferTransactionDocumentSchema = z.object({
    id: z.string().uuid(),
    date: DayjsToStringTransformer,
    description: z.string(),
    value: MonetaryAmountToStringTransformer,
    fromId: z.string().uuid(),
    toId: z.string().uuid(),
});

export const ExternalTransactionDocumentSchema = z.object({
    id: z.string().uuid(),
    date: DayjsToStringTransformer,
    description: z.string(),
    value: MonetaryAmountToStringTransformer,
    accountId: z.string().uuid(),
    type: ExternalTransactionTypeSchema,
});

export const TransactionDocumentSchema = z.union([
    TransferTransactionDocumentSchema,
    ExternalTransactionDocumentSchema,
]);

export type TransactionDocument = z.infer<typeof TransactionDocumentSchema>;

export const TransactionCollectionSchema = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: {
            type: "string",
            maxLength: 40,
        },

        date: {
            type: "string",
        },

        description: {
            type: "string",
        },

        value: {
            type: "string",
        },
        
        fromId: {
            type: "string"
        },

        toId: {
            type: "string",
        },
        
        accountId: {
            type: "string",
        },

        type: {
            type: "string"
        },
    },
    required: ["id", "date", "description", "value"],
} as const;

const schemaTyped = toTypedRxJsonSchema(TransactionCollectionSchema);

export type TransactionDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
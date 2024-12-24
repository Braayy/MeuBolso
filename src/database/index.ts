import { AccountCollectionSchema, AccountDocument } from "./Account";

import { addRxPlugin, createRxDatabase, RxCollection} from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { replicateCouchDB, getFetchWithCouchDBAuthorization } from "rxdb/plugins/replication-couchdb";
import { TransactionCollectionSchema, TransactionDocument } from "./Transaction";

addRxPlugin(RxDBDevModePlugin);

export const rxDatabase = await createRxDatabase<{
    accounts: RxCollection<AccountDocument>,
    transactions: RxCollection<TransactionDocument>,
}>({
    name: "meu-bolso",
    storage: getRxStorageDexie(),
});

await rxDatabase.addCollections({
    accounts: {
        schema: AccountCollectionSchema,
    },
    transactions: {
        schema: TransactionCollectionSchema,
    },
});

replicateCouchDB({
    replicationIdentifier: "meu-bolso-accounts",
    collection: rxDatabase.accounts,

    url: "http://localhost:5984/meu-bolso-accounts/",

    fetch: getFetchWithCouchDBAuthorization("admin", "senha123"),

    pull: {},
    push: {},
});

replicateCouchDB({
    replicationIdentifier: "meu-bolso-transactions",
    collection: rxDatabase.transactions,

    url: "http://localhost:5984/meu-bolso-transactions/",

    fetch: getFetchWithCouchDBAuthorization("admin", "senha123"),

    pull: {},
    push: {},
});
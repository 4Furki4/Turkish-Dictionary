// src/server/api/handlers/request-handlers/registry.ts
import { EntityTypes, Actions } from "@/db/schema/requests";
import { RequestHandler } from "./types";
import { CreateWordAttributeHandler, UpdateWordAttributeHandler } from "./word-attribute-handlers";
import { UpdateWordHandler } from "./word-handler";
import { UpdateMeaningHandler, DeleteMeaningHandler } from "./meaning-handler";
// Import other handlers

type HandlerRegistry = {
    [key in EntityTypes]?: {
        [key in Actions]?: RequestHandler<any>
    };
};

const registry: HandlerRegistry = {
    word_attributes: {
        create: new CreateWordAttributeHandler(),
        update: new UpdateWordAttributeHandler(),
    },
    words: {
        update: new UpdateWordHandler(),
    },
    meanings: {
        update: new UpdateMeaningHandler(),
        delete: new DeleteMeaningHandler(),
    },
    // Add other entity types and actions...
};

export function getHandler(entityType: EntityTypes, action: Actions): RequestHandler<any> | undefined {
    return registry[entityType]?.[action];
}
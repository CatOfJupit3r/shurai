import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import { ObjectIdString } from '../helpers';

@modelOptions({ schemaOptions: { collection: 'workspace_template_items', timestamps: true } })
class WorkspaceTemplateItemClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, index: true })
  public templateId!: string;

  @prop({ required: true, maxlength: 100 })
  public name!: string;

  @prop({ maxlength: 1000 })
  public description?: string;

  @prop()
  public assetId?: string;

  @prop({ index: true })
  public parentId?: string | null;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const WorkspaceTemplateItemModel = getModelForClass(WorkspaceTemplateItemClass);
export type WorkspaceTemplateItemDoc = DocumentType<WorkspaceTemplateItemClass>;

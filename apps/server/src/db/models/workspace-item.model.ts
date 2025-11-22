import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import { ObjectIdString } from '../helpers';

@modelOptions({ schemaOptions: { collection: 'workspace_items', timestamps: true } })
class WorkspaceItemClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, index: true })
  public workspaceId!: string;

  @prop({ required: true, maxlength: 100 })
  public name!: string;

  @prop({ maxlength: 1000 })
  public description?: string;

  @prop({ type: Date })
  public acquireDate?: Date;

  @prop()
  public assetId?: string;

  @prop({ index: true })
  public parentId?: string | null;

  @prop({ required: true, default: 0 })
  public order!: number;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const WorkspaceItemModel = getModelForClass(WorkspaceItemClass);
export type WorkspaceItemDoc = DocumentType<WorkspaceItemClass>;

import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import type { WorkspaceVisibility } from '@shurai/shared/enums/workspace.enums';

import { ObjectIdString } from '../helpers';

@modelOptions({ schemaOptions: { collection: 'workspaces', timestamps: true } })
class WorkspaceClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, index: true })
  public userId!: string;

  @prop({ required: true, maxlength: 100 })
  public title!: string;

  @prop({ maxlength: 1000 })
  public description?: string;

  @prop()
  public coverAssetId?: string;

  @prop({ required: true, index: true, enum: ['PUBLIC', 'PRIVATE'] })
  public visibility!: WorkspaceVisibility;

  @prop({ index: true, unique: true, sparse: true })
  public shareableSlug?: string;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const WorkspaceModel = getModelForClass(WorkspaceClass);
export type WorkspaceDoc = DocumentType<WorkspaceClass>;

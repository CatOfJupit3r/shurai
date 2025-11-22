/* eslint-disable max-classes-per-file */
import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import type { TemplateScope } from '@shurai/shared/enums/workspace.enums';

import { ObjectIdString } from '../helpers';

class TemplateItemClass {
  @prop({ required: true, maxlength: 100 })
  public name!: string;

  @prop({ maxlength: 1000 })
  public description?: string;

  @prop()
  public assetId?: string;

  @prop({ type: () => [TemplateItemClass] })
  public children?: TemplateItemClass[];
}

@modelOptions({ schemaOptions: { collection: 'workspace_templates', timestamps: true } })
class WorkspaceTemplateClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, index: true })
  public userId!: string;

  @prop({ required: true, maxlength: 100 })
  public name!: string;

  @prop({ maxlength: 500 })
  public description?: string;

  @prop({ required: true, index: true, enum: ['PERSONAL', 'COMMUNITY'] })
  public scope!: TemplateScope;

  @prop({ required: true, type: () => TemplateItemClass })
  public rootItem!: TemplateItemClass;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const WorkspaceTemplateModel = getModelForClass(WorkspaceTemplateClass);
export type WorkspaceTemplateDoc = DocumentType<WorkspaceTemplateClass>;

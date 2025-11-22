import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import type { TemplateScope } from '@shurai/shared/enums/workspace.enums';

import { ObjectIdString } from '../helpers';

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

  @prop({ required: true, index: true })
  public rootItemId!: string;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const WorkspaceTemplateModel = getModelForClass(WorkspaceTemplateClass);
export type WorkspaceTemplateDoc = DocumentType<WorkspaceTemplateClass>;

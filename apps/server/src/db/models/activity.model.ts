import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import type { ActivityAction, ActivityEntityType } from '@shurai/shared/enums/activity.enums';

import { ObjectIdString } from '../helpers';

@modelOptions({ schemaOptions: { collection: 'activities', timestamps: true } })
class ActivityClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, index: true })
  public userId!: string;

  @prop({ index: true })
  public workspaceId?: string;

  @prop({ required: true, index: true, enum: ['CREATE', 'UPDATE', 'DELETE'], type: String })
  public action!: ActivityAction;

  @prop({ required: true, index: true, enum: ['WORKSPACE', 'ITEM', 'TEMPLATE', 'ASSET'], type: String })
  public entityType!: ActivityEntityType;

  @prop({ required: true })
  public entityId!: string;

  @prop()
  public entityName?: string;

  @prop({ type: () => Object })
  public metadata?: Record<string, unknown>;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const ActivityModel = getModelForClass(ActivityClass);
export type ActivityDoc = DocumentType<ActivityClass>;

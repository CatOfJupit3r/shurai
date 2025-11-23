/* eslint-disable max-classes-per-file */
import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import { ASSET_TYPE } from '@shurai/shared/enums/workspace.enums';
import type { AssetType } from '@shurai/shared/enums/workspace.enums';

import { ObjectIdString } from '../helpers';

class ThemeConfigClass {
  @prop()
  public primaryColor?: string;

  @prop()
  public secondaryColor?: string;

  @prop()
  public accentColor?: string;
}

@modelOptions({ schemaOptions: { collection: 'workspace_assets', timestamps: true } })
class WorkspaceAssetClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, index: true })
  public userId!: string;

  @prop({ required: true, maxlength: 100 })
  public name!: string;

  @prop({ maxlength: 500 })
  public description?: string;

  @prop({ required: true, index: true, enum: Object.values(ASSET_TYPE), type: String })
  public type!: AssetType;

  @prop()
  public iconUrl?: string;

  @prop()
  public imageUrl?: string;

  @prop({ type: () => ThemeConfigClass })
  public themeConfig?: ThemeConfigClass;

  @prop({ default: false, index: true })
  public isGlobal!: boolean;

  public createdAt!: Date;

  public updatedAt!: Date;
}

export const WorkspaceAssetModel = getModelForClass(WorkspaceAssetClass);
export type WorkspaceAssetDoc = DocumentType<WorkspaceAssetClass>;

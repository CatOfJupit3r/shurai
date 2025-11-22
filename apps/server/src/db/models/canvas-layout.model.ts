/* eslint-disable max-classes-per-file */
import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import type { DocumentType } from '@typegoose/typegoose';

import type { CanvasNodeType } from '@shurai/shared/enums/canvas.enums';

import { ObjectIdString } from '../helpers';

class CanvasNodePositionClass {
  @prop({ required: true })
  public x!: number;

  @prop({ required: true })
  public y!: number;
}

class CanvasNodeSizeClass {
  @prop({ required: true })
  public width!: number;

  @prop({ required: true })
  public height!: number;
}

class CanvasNodeAssetHintsClass {
  @prop()
  public aspectRatio?: number;

  @prop()
  public dominantColor?: string;
}

class CanvasNodeClass {
  @prop({ required: true })
  public id!: string;

  @prop({ required: true, enum: ['ITEM', 'ASSET', 'SUB_CANVAS'] })
  public type!: CanvasNodeType;

  @prop({ required: true, _id: false, type: () => CanvasNodePositionClass })
  public position!: CanvasNodePositionClass;

  @prop({ required: true, _id: false, type: () => CanvasNodeSizeClass })
  public size!: CanvasNodeSizeClass;

  @prop()
  public itemId?: string;

  @prop()
  public assetId?: string;

  @prop()
  public subCanvasId?: string;

  @prop()
  public zIndex?: number;

  @prop()
  public rotation?: number;

  @prop()
  public opacity?: number;

  @prop({ _id: false, type: () => CanvasNodeAssetHintsClass })
  public assetHints?: CanvasNodeAssetHintsClass;
}

class CanvasSizeClass {
  @prop({ required: true })
  public width!: number;

  @prop({ required: true })
  public height!: number;
}

@modelOptions({ schemaOptions: { collection: 'workspace_content_canvases', timestamps: true } })
class WorkspaceContentCanvasClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, index: true })
  public workspaceId!: string;

  @prop({ required: true, maxlength: 100 })
  public name!: string;

  @prop({ maxlength: 1000 })
  public description?: string;

  @prop({ required: true, type: () => [CanvasNodeClass], default: [] })
  public nodes!: CanvasNodeClass[];

  @prop()
  public backgroundColor?: string;

  public createdAt!: Date;

  public updatedAt!: Date;
}

class CanvasLayoutClass {
  @prop({ default: () => ObjectIdString() })
  public _id!: string;

  @prop({ required: true, type: () => [CanvasNodeClass], default: [] })
  public nodes!: CanvasNodeClass[];

  @prop({ required: true, _id: false, type: () => CanvasSizeClass })
  public canvasSize!: CanvasSizeClass;

  @prop()
  public backgroundColor?: string;

  @prop()
  public gridEnabled?: boolean;

  @prop()
  public gridSize?: number;

  @prop({ required: true, default: 0 })
  public revision!: number;

  @prop({ required: true })
  public lastModifiedBy!: string;

  @prop({ required: true, default: () => new Date() })
  public createdAt!: Date;

  @prop({ required: true, default: () => new Date() })
  public updatedAt!: Date;
}

export const WorkspaceContentCanvasModel = getModelForClass(WorkspaceContentCanvasClass);
export type WorkspaceContentCanvasDoc = DocumentType<WorkspaceContentCanvasClass>;

export { CanvasLayoutClass, CanvasNodeClass };

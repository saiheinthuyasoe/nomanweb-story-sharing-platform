'use client';

import React, { Suspense } from 'react';
import { 
  $applyNodeReplacement, 
  DecoratorNode, 
  NodeKey,
  LexicalNode,
  DOMConversionMap,
  DOMConversion,
  DOMExportOutput,
  SerializedLexicalNode,
  Spread
} from 'lexical';

const ImageComponent = React.lazy(() => import('./ImageComponent'));

function convertImageElement(domNode: Element): null | DOMConversion {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;
    const node = $createImageNode({ 
      altText, 
      height: height || 'inherit', 
      src, 
      width: width || 'inherit' 
    });
    return { node };
  }
  return null;
}

export interface ImagePayload {
  altText: string;
  height?: number | string;
  key?: NodeKey;
  maxWidth?: number;
  src: string;
  width?: number | string;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number | string;
    maxWidth: number;
    src: string;
    width?: number | string;
    type: 'image';
    version: 1;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | string;
  __height: number | string;
  __maxWidth: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, maxWidth, src } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      src,
      width,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width !== 'inherit') {
      element.setAttribute('width', this.__width.toString());
    }
    if (this.__height !== 'inherit') {
      element.setAttribute('height', this.__height.toString());
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: number | string,
    height?: number | string,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 'inherit' : this.__height,
      maxWidth: this.__maxWidth,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 'inherit' : this.__width,
    };
  }

  setWidthAndHeight(width: number | string, height: number | string): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'editor-image';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={<div className="w-full h-32 bg-gray-100 animate-pulse rounded" />}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          nodeKey={this.getKey()}
          resizable={true}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  src,
  width,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(
      src,
      altText,
      maxWidth,
      width,
      height,
      key
    )
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
} 
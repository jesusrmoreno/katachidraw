import * as React from "react"; // for expo
import { FC, memo } from "react";
import { Platform } from "react-native";
import { G, Path, Image, Rect } from "react-native-svg";
import { useAtom } from "jotai";

import { modeAtom } from "../atoms/canvas";
import {
  ShapeAtom,
  selectAtom,
  TShapePath,
  TShapeImage,
} from "../atoms/shapes";
import {
  setPressingShapeAtom,
  IsPointInShape,
  registerIsPointInShapeAtom,
} from "../atoms/drag";
import { hackTouchableNode } from "../utils/touchHandlerHack";

const ShapePath: React.FC<{
  shapeAtom: ShapeAtom;
  shape: TShapePath;
}> = ({ shapeAtom, shape }) => {
  const [mode] = useAtom(modeAtom); // XXX this is very unfortunate (re-render all shapes)
  const [, select] = useAtom(selectAtom);
  const [, setPressingShape] = useAtom(setPressingShapeAtom);
  const [, registerIsPointInShape] = useAtom(registerIsPointInShapeAtom);

  return (
    <G
      transform={`translate(${shape.x} ${shape.y})`}
      onStartShouldSetResponder={() => mode !== "pen"}
      onPress={() => {
        select(shapeAtom);
      }}
      onPressIn={() => {
        setPressingShape(shapeAtom);
      }}
      onPressOut={() => {
        setPressingShape(null);
      }}
      ref={(instance: any) => {
        hackTouchableNode(instance);
        let isPointInShape: IsPointInShape;
        if (Platform.OS === "web") {
          const node = instance?._touchableNode;
          isPointInShape = (pos) => {
            const ele = document.elementFromPoint(pos[0], pos[1]);
            return !!node && (ele === node || ele?.parentNode === node);
          };
        } else {
          isPointInShape = (pos, offset, zoom) => {
            const point = instance.ownerSVGElement.createSVGPoint();
            point.x = offset.x + pos[0] / zoom;
            point.y = offset.y + pos[1] / zoom;
            // TODO isPointInStroke doesn't work
            // x/y straight lines don't work
            return instance.isPointInFill(point);
          };
        }
        registerIsPointInShape({ shapeAtom, isPointInShape });
      }}
    >
      <Path
        d={shape.path}
        fill="none"
        stroke="red"
        opacity={shape.selected ? 0.2 : 0}
        strokeWidth="30"
      />
      <Path d={shape.path} fill="none" stroke={shape.color} strokeWidth="4" />
      {/* HACK for RN's buggy isPointInStroke? */}
      <G transform="rotate(0.2)">
        <Path d={shape.path} opacity="0" />
      </G>
      <G transform="rotate(-0.2)">
        <Path d={shape.path} opacity="0" />
      </G>
    </G>
  );
};

const ShapeImage: React.FC<{
  shapeAtom: ShapeAtom;
  shape: TShapeImage;
}> = ({ shapeAtom, shape }) => {
  const [, select] = useAtom(selectAtom);
  const [, setPressingShape] = useAtom(setPressingShapeAtom);

  return (
    <G transform={`translate(${shape.x} ${shape.y})`}>
      <G
        onPress={() => {
          select(shapeAtom);
        }}
        onPressIn={() => {
          setPressingShape(shapeAtom);
        }}
        onPressOut={() => {
          setPressingShape(null);
        }}
        ref={(instance: any) => {
          hackTouchableNode(instance);
        }}
      >
        <Rect
          x="-24"
          y="-24"
          width="36"
          height="36"
          fill="red"
          opacity={shape.selected ? 0.2 : 0}
        />
        <Rect x="-12" y="-12" width="12" height="12" fill="gray" />
      </G>
      <Image
        href={
          Platform.OS === "web" ? (shape.image as any) : { uri: shape.image }
        }
        width={shape.width}
        height={shape.height}
        preserveAspectRatio="xMinYMin meet"
      />
    </G>
  );
};

export const Shape: FC<{
  shapeAtom: ShapeAtom;
}> = ({ shapeAtom }) => {
  const [shape] = useAtom(shapeAtom);

  if ("path" in shape) {
    return <ShapePath shapeAtom={shapeAtom} shape={shape} />;
  }
  if ("image" in shape) {
    return <ShapeImage shapeAtom={shapeAtom} shape={shape} />;
  }
  return null;
};

export default memo(Shape);

"use client";
import { useCallback, useRef, useState } from "react";
import { Stage, Layer, Rect as KonvaRect } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import { DrawAction, PAINT_OPTIONS } from "@/constants/canvas.constants";
import Konva from "konva";
import { io } from "socket.io-client";
import { throttle } from "lodash";
import { Rectangle } from "@/types/Paint.types";

const socket = io("http://localhost:4000");

const CanvasBoard = () => {
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);

  const currentShapeRef = useRef<string>("");
  const isPaintRef = useRef(false);
  const stageRef = useRef<Konva.Stage>(null);
  const [drawAction, setDrawAction] = useState<DrawAction>(DrawAction.Select);

  // socket.io client setup

  socket.on("connect", () => {
    console.log("Connected to server", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });

  socket.on("receive-data", (data: Rectangle) => {
    setRectangles((prev) => {
      const exists = prev.some((r) => r.id === data.id);
      return exists
        ? prev.map((r) => (r.id === data.id ? data : r))
        : [...prev, data];
    });
  });

  // Example of emitting an event
  const sendData = useCallback(
    throttle((data) => {
      socket.emit("send-data", data);
    }, 200), // send max every 200ms
    []
  );

  // ---- socket.io client setup end -----

  const onStageMouseUp = useCallback(() => {
    isPaintRef.current = false;
  }, []);

  const onStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (drawAction === DrawAction.Select) return;
      isPaintRef.current = true;
      const stage = stageRef?.current;
      const pos = stage?.getPointerPosition();
      const x = pos?.x || 0;
      const y = pos?.y || 0;
      const id = uuidv4();
      currentShapeRef.current = id;

      switch (drawAction) {
        case DrawAction.Rectangle: {
          setRectangles((prevRectangles) => [
            ...prevRectangles,
            {
              id,
              height: 1,
              width: 1,
              x,
              y,
              color: "black",
              bgColor: "blue",
            },
          ]);

          break;
        }
      }
    },
    [drawAction]
  );

  const onStageMouseMove = useCallback(() => {
    if (drawAction === DrawAction.Select || !isPaintRef.current) return;

    const stage = stageRef?.current;
    const id = currentShapeRef.current;
    const pos = stage?.getPointerPosition();
    const x = pos?.x || 0;
    const y = pos?.y || 0;

    switch (drawAction) {
      case DrawAction.Rectangle: {
        setRectangles((prevRectangles) =>
          prevRectangles?.map((prevRectangle) =>
            prevRectangle.id === id
              ? {
                  ...prevRectangle,
                  height: y - prevRectangle.y,
                  width: x - prevRectangle.x,
                }
              : prevRectangle
          )
        );
        break;
      }
    }
  }, [drawAction]);

  const addRectangleShape = () => {
    const id = uuidv4();

    const newRectangle: Rectangle = {
      id,
      x: 50,
      y: 50,
      width: 100,
      height: 200,
      color: "black",
    };
    setRectangles((prev) => [...prev, newRectangle]);
    sendData(newRectangle);
  };

  const isDraggable = drawAction === DrawAction.Select;

  const onStageDragMove = useCallback(
    (evt: KonvaEventObject<DragEvent, Node<NodeConfig>>) => {
      const node = evt.target;
      const id = node.id();

      if (!id) return;

      const updatedShape = {
        id,
        x: node.x(),
        y: node.y(),
        width: node.width(),
        height: node.height(),
        color: "black",
      };

      sendData(updatedShape);
    },
    []
  );
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="font-bold text-4xl text-gray-800 pb-5">Canvas Board</h1>
      <div className="flex gap-3 pb-4">
        {PAINT_OPTIONS.map(({ id, label }, index: number) => {
          return (
            <button
              key={index}
              className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded"
              onClick={() => setDrawAction(id)}
            >
              {label}
            </button>
          );
        })}
        <button
          className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded"
          onClick={addRectangleShape}
        >
          Add Rectangle
        </button>
      </div>
      <Stage
        width={500}
        height={500}
        className="border border-gray-400 p-4"
        ref={stageRef}
        onMouseUp={onStageMouseUp}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
        onDragMove={onStageDragMove}
      >
        <Layer>
          {/* <KonvaRect
            x={20}
            y={50}
            width={100}
            height={100}
            // fill="red"
            // shadowBlur={10}
            draggable
            fill="white"
            id="bg"
            onClick={onBgClick}
          /> */}
          {rectangles.map((rectangle, index) => (
            <KonvaRect
              key={index}
              x={rectangle?.x}
              y={rectangle?.y}
              height={rectangle?.height}
              width={rectangle?.width}
              stroke={rectangle?.color}
              fill="lightBlue"
              id={rectangle?.id}
              strokeWidth={3}
              draggable={isDraggable}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasBoard;

import Box from "@mui/system/Box";
import ListColumns from "./ListColumns/ListColumns";
import { mapOrder } from "~/utils/sorts";
import Column from "./ListColumns/Column/Column";
import Card from "./ListColumns/Column/ListCards/Card/Card";
import { cloneDeep } from "lodash";

import {
  DndContext,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects,
  pointerWithin,
  getFirstCollision,
} from "@dnd-kit/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: "DRAG_ITEM_COLUMN",
  CARD: "DRAG_ITEM_CARD",
};

function BoardContent({ board }) {
  // const pointerSensor = useSensor(PointerSensor, {
  //   activationConstraint: { distance: 10 },
  // });
  // Yeu cau chuot di chuyen 10px thi moi kich hoat event
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  // Nhan giu 250ms va dung sai cua cam ung chenh lech 5px thi kich hoat event
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });

  // const sensors = useSensors(pointerSensor);
  const sensors = useSensors(mouseSensor, touchSensor);

  const [orderedColumns, setOrderedColumns] = useState([]);

  // Cung 1 thoi diem chi co 1 phan tu dang duoc keo
  const [activeDragItemId, setActiveDragItemId] = useState(null);
  const [activeDragItemType, setActiveDragItemType] = useState(null);
  const [activeDragItemData, setActiveDragItemData] = useState(null);
  const [originalDragItemColumnData, setOriginalDragItemColumnData] =
    useState(null);

  // Diem va cham cuoi cung xu ly thuat toan phat hien va cham
  const lastOverId = useRef(null);

  useEffect(() => {
    // console.log("useEffect");
    setOrderedColumns(mapOrder(board?.columns, board?.columnOrderIds, "_id"));
  }, [board]);

  const findColumnByCardId = (cardId) => {
    return orderedColumns.find((column) =>
      column?.cards?.map((card) => card._id)?.includes(cardId)
    );
  };

  const moveCardBetweenDifferentColumns = (
    active,
    over,
    overColumn,
    activeColumn,
    overCardId,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
    setOrderedColumns((prevColumns) => {
      const overCardIndex = overColumn.cards.findIndex(
        (card) => card._id === overCardId
      );
      // console.log("setOrderedColumns ~ overCardIndex:", overCardIndex);

      const isBelowOverCard =
        active.rect.current.tranlated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height;
      const modifier = isBelowOverCard ? 1 : 0;
      let newCardIndex =
        overCardIndex >= 0
          ? overCardIndex + modifier
          : overColumn.cards.length + 1;

      const nextColumns = cloneDeep(prevColumns);
      const nextActiveColumn = nextColumns.find(
        (column) => column._id === activeColumn._id
      );
      const nextOverColumn = nextColumns.find(
        (column) => column._id === overColumn._id
      );

      // Xoa card dang duoc keo khoi activeColumn
      if (nextActiveColumn) {
        nextActiveColumn.cards = nextActiveColumn.cards.filter(
          (card) => card._id !== activeDraggingCardId
        );

        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(
          (card) => card._id
        );
      }

      // Cap nhat lai overColumn moi voi card dang duoc keo
      if (nextOverColumn) {
        const updatedActiveDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id,
        };

        nextOverColumn.cards = nextOverColumn.cards.toSpliced(
          newCardIndex,
          0,
          updatedActiveDraggingCardData
        );

        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(
          (card) => card._id
        );
      }

      return nextColumns;
    });
  };

  const handleDragStart = (event) => {
    // console.log("handleDragStart: ", event);
    setActiveDragItemId(event?.active?.id);
    setActiveDragItemType(
      event?.active?.data?.current?.columnId
        ? ACTIVE_DRAG_ITEM_TYPE.CARD
        : ACTIVE_DRAG_ITEM_TYPE.COLUMN
    );
    setActiveDragItemData(event?.active?.data?.current);

    if (event.active.data.current?.columnId) {
      setOriginalDragItemColumnData(findColumnByCardId(event.active?.id));
    }
  };

  const handleDragOver = (event) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return;
    const { active, over } = event;

    if (!active || !over) return;

    const {
      id: activeDraggingCardId,
      data: { current: activeDraggingCardData },
    } = active;
    const { id: overId } = over;
    // overId co the la column id hoac card id

    const activeColumn = findColumnByCardId(activeDraggingCardId);
    const overColumn = !overId.includes("column")
      ? findColumnByCardId(overId)
      : orderedColumns.find((c) => c._id === overId);

    if (!activeColumn || !overColumn) return;

    // Xu ly keo tha Card o 2 Column khac nhau
    if (activeColumn._id !== overColumn._id) {
      moveCardBetweenDifferentColumns(
        active,
        over,
        overColumn,
        activeColumn,
        overId,
        activeDraggingCardId,
        activeDraggingCardData
      );
    }
  };

  const handleDragEnd = (event) => {
    // console.log("handleDragEnd: ", event);
    const { active, over } = event;

    // Kiem tra neu vi tri khong ton tai
    if (!active || !over) return;

    // Xu ly keo tha Column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active.id !== over.id) {
        // Lay vi tri  truoc khi keo
        const oldColumnIndex = orderedColumns.findIndex(
          (c) => c._id === active.id
        );
        // Lay vi tri sau khi keo
        const newColumnIndex = orderedColumns.findIndex(
          (c) => c._id === over.id
        );
        // Sap xep lai column sau khi keo tha
        const dndOrderedColumns = arrayMove(
          orderedColumns,
          oldColumnIndex,
          newColumnIndex
        );
        // update state
        setOrderedColumns(dndOrderedColumns);
      }
    }

    // Xu ly keo tha Card
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      const {
        id: activeDraggingCardId,
        data: { current: activeDraggingCardData },
      } = active;
      const { id: overId } = over;

      const activeColumn = findColumnByCardId(activeDraggingCardId);
      // overId co the la column id hoac card id
      const overColumn = !overId.includes("column")
        ? findColumnByCardId(overId)
        : orderedColumns.find((c) => c._id === overId);

      if (!activeColumn || !overColumn) return;

      // Keo tha Card o 2 cot khac nhau
      if (originalDragItemColumnData._id !== overColumn._id) {
        moveCardBetweenDifferentColumns(
          active,
          over,
          overColumn,
          activeColumn,
          overId,
          activeDraggingCardId,
          activeDraggingCardData
        );
      } else {
        // Lay vi tri Card truoc khi keo
        const oldCardIndex = originalDragItemColumnData?.cards?.findIndex(
          (c) => c._id === activeDragItemId
        );
        // Lay vi tri Card sau khi keo
        const newCardIndex = overColumn?.cards.findIndex(
          (c) => c._id === overId
        );
        // Sap xep lai Cards sau khi keo tha
        const dndOrderedCards = arrayMove(
          originalDragItemColumnData?.cards,
          oldCardIndex,
          newCardIndex
        );

        setOrderedColumns((prevColumns) => {
          // Xu ly tuong tu keo tha Column trong Board
          const nextColumns = cloneDeep(prevColumns);

          const targetColumn = nextColumns.find(
            (c) => c._id === overColumn._id
          );
          targetColumn.cards = dndOrderedCards;
          targetColumn.cardOrderIds = dndOrderedCards.map((c) => c._id);

          return nextColumns;
        });
      }
    }

    setActiveDragItemId(null);
    setActiveDragItemType(null);
    setActiveDragItemData(null);
    setOriginalDragItemColumnData(null);
  };

  // console.log("activeDragItemId: ", activeDragItemId);
  // console.log("activeDragItemType: ", activeDragItemType);
  // console.log("activeDragItemData: ", activeDragItemData);

  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  const collisionDetectionStrategy = useCallback(
    (args) => {
      if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
        return closestCorners({ ...args });
      }

      // Tim diem va cham voi con tro khi keo
      const poiterIntersections = pointerWithin(args);

      if (!poiterIntersections) return;
      // const intersections =
      //   poiterIntersections.length > 0
      //     ? poiterIntersections
      //     : rectIntersection(args);

      let overId = getFirstCollision(poiterIntersections, "id");
      if (overId) {
        const checkColumn = orderedColumns.find((c) => c._id === overId);
        let overCardId = null;
        if (checkColumn) {
          overCardId = closestCorners({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container) => {
                return (
                  container.id === overId &&
                  checkColumn?.cardOrderIds?.includes(container.id)
                );
              }
            ),
          })[0]?.id;
        }

        if (overCardId) {
          lastOverId.current = overCardId;
          return [{ id: overCardId }];
        } else {
          lastOverId.current = overId;
          return [{ id: overId }];
        }
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeDragItemType, orderedColumns]
  );

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
    >
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#34495e" : "#1976d2",
          width: "100%",
          height: (theme) => theme.trello.boardContentHeight,
          p: "10px 0",
        }}
      >
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={customDropAnimation}>
          {!activeDragItemType && null}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN && (
            <Column column={activeDragItemData} />
          )}
          {activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD && (
            <Card card={activeDragItemData} />
          )}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}

export default BoardContent;

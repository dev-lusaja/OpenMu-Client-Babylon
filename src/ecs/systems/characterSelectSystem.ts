import { PointerEventTypes, Vector3 } from '../../libs/babylon/exports';
import type { Entity, ISystemFactory } from '../world';
import { Store, UIState } from '../../store';
import { ENUM_WORLD } from '../../common';
import { spawnPlayer } from '../../logic';
import { deserializeAppearance } from '../../common/deserializeAppearance';
import {
  characterSlotAngle,
  characterSlotPosition,
  CHARACTER_CAMERA_FORWARD,
} from '../../common/characterSelect';
import { setSceneHold } from '../../common/sceneGate';

/** This system's name on the loading gate (`common/sceneGate.ts`). */
const GATE = 'characterSelect';

// Step‑forward visual configuration
const STEP_FORWARD_DISTANCE = 0.35; // world units (roughly 35 cm in MU scale)
const STEP_SPEED = 0.1; // interpolation factor per frame (0‑1)
// Direction from character toward the camera (horizontal only)
const STEP_DIRECTION = new Vector3(
  -CHARACTER_CAMERA_FORWARD.x,
  0,
  -CHARACTER_CAMERA_FORWARD.z
).normalize();
// Track per‑entity offset progress (0 = original, 1 = fully stepped forward)
const offsetMap = new Map<Entity, number>();

export const CharacterSelectSystem: ISystemFactory = world => {
  const spawned: Entity[] = [];

  let stagedFor: string | null = null;

  const clear = () => {
    for (const entity of spawned) {
      entity.modelObject?.dispose();
      world.remove(entity);
    }

    spawned.length = 0;
    stagedFor = null;
    offsetMap.clear();
  };

  const stage = () => {
    clear();

    for (const character of Store.charactersList) {
      const position = characterSlotPosition(character.SlotIndex);

      if (!position) continue;

      const appearance = deserializeAppearance(character.Appearance);
      const entity = spawnPlayer(world, { cls: appearance.cls });

      world.addComponent(
        entity,
        'worldIndex',
        ENUM_WORLD.WD_74NEW_CHARACTER_SCENE
      );

      entity.transform.pos.x = position.x;
      entity.transform.pos.y = position.y;
      entity.transform.pos.z = position.z;

      entity.transform.posOffset = Vector3.Zero();

      entity.transform.rot.y = characterSlotAngle(character.SlotIndex);

      entity.objectNameInWorld = character.Name;

      world.addComponent(entity, 'interactable', true);

      const app = entity.charAppearance;

      app.leftHand = appearance.leftHand;
      app.rightHand = appearance.rightHand;
      app.helm = appearance.helm;
      app.armor = appearance.armor;
      app.pants = appearance.pants;
      app.gloves = appearance.gloves;
      app.boots = appearance.boots;
      app.changed = true;

      spawned.push(entity);
    }
  };

  world.scene.onPointerObservable.add(event => {
    if (event.type !== PointerEventTypes.POINTERDOWN) return;
    if (Store.uiState !== UIState.Characters) return;

    const target = world.currentPointerTarget;
    if (!target || !spawned.includes(target)) return;

    const name = target.objectNameInWorld;
    if (!name || name === Store.focusedChar) return;

    Store.focusedChar = name;

    Store.focusCharacterRequest(name);
  });

  return {
    update: () => {
      const staged =
        Store.uiState === UIState.Characters &&
        world.mapIndex === ENUM_WORLD.WD_74NEW_CHARACTER_SCENE &&
        !!world.terrain;

      if (!staged) {
        if (stagedFor !== null) clear();
        // The line-up is part of this screen's load, so the loading screen
        // has to wait for it: the terrain lands first and the character list
        // is still in flight, and without this hold the gate lifted on an
        // empty scene with the characters walking in behind it.
        setSceneHold(GATE, Store.uiState === UIState.Characters);
        return;
      }

      const key = Store.charactersList
        .map(c => `${c.SlotIndex}:${c.Name}:${c.Level}`)
        .join('|');

      if (key !== stagedFor) {
        stage();
        stagedFor = key;
      }

      // Apply step‑forward animation based on focused character
      for (const entity of spawned) {
        const isFocused = entity.objectNameInWorld === Store.focusedChar;
        const target = isFocused ? 1 : 0;
        const current = offsetMap.get(entity) ?? 0;
        const newOffset = Math.abs(current - target) < 0.01 ? target : current + (target - current) * STEP_SPEED;
        offsetMap.set(entity, newOffset);
        // Apply horizontal offset toward the camera
        entity.transform.posOffset = STEP_DIRECTION.scale(STEP_FORWARD_DISTANCE * newOffset);
      }

      // Spawned: from here the models are counted by the ready check like
      // every other one in the scene.
      setSceneHold(GATE, Store.loadingCharactersList);
    },
  };
};

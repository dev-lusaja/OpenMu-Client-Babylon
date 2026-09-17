import {
  Color3,
  MeshBuilder,
  PointerEventTypes,
  StandardMaterial,
  Vector3,
  type Mesh,
} from '../../libs/babylon/exports';
import type { Entity, ISystemFactory } from '../world';
import { Store, UIState } from '../../store';
import { ENUM_WORLD } from '../../common';
import { spawnPlayer } from '../../logic';
import { deserializeAppearance } from '../../common/deserializeAppearance';
import {
  characterSlotAngle,
  characterSlotPosition,
} from '../../common/characterSelect';
import { setSceneHold } from '../../common/sceneGate';

/** This system's name on the loading gate (`common/sceneGate.ts`). */
const GATE = 'characterSelect';

export const CharacterSelectSystem: ISystemFactory = world => {
  const spawned: Entity[] = [];

  let stagedFor: string | null = null;

  let selectionRing: Mesh | null = null;

  const createSelectionRing = (): Mesh => {
    const disc = MeshBuilder.CreateDisc(
      'charSelectGlowRing',
      { radius: 0.9, tessellation: 32 },
      world.scene
    );
    disc.rotation.x = Math.PI / 2;
    const mat = new StandardMaterial('charSelectGlowMat', world.scene);
    mat.diffuseColor = new Color3(1, 0.85, 0.2);
    mat.emissiveColor = new Color3(1, 0.8, 0.1);
    mat.alpha = 0.5;
    mat.disableLighting = true;
    disc.material = mat;
    disc.isPickable = false;
    return disc;
  };

  const clear = () => {
    for (const entity of spawned) {
      entity.modelObject?.dispose();
      world.remove(entity);
    }

    if (selectionRing) {
      selectionRing.material?.dispose();
      selectionRing.dispose();
      selectionRing = null;
    }

    spawned.length = 0;
    stagedFor = null;
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

      entity.transform.posOffset = Vector3.ZeroReadOnly;

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

      // Spawned: from here the models are counted by the ready check like
      // every other one in the scene.
      setSceneHold(GATE, Store.loadingCharactersList);

      // Update selection ring under focused character
      const focusedName = Store.focusedChar;
      const focusedEntity = spawned.find(
        e => e.objectNameInWorld === focusedName
      );

      if (focusedEntity && focusedEntity.transform) {
        if (!selectionRing) {
          selectionRing = createSelectionRing();
        }
        selectionRing.isVisible = true;
        selectionRing.position.x = focusedEntity.transform.pos.x;
        selectionRing.position.y = focusedEntity.transform.pos.y + 0.02;
        selectionRing.position.z = focusedEntity.transform.pos.z;
      } else if (selectionRing) {
        selectionRing.isVisible = false;
      }
    },
  };
};

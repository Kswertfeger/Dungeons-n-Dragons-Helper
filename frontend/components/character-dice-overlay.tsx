import { DiceRollerModal } from '@/components/dice-roller-modal';
import { FloatingDiceButton } from '@/components/floating-dice-button';
import { type Character } from '@/services/api';
import React, { useState } from 'react';

type Props = {
  character: Character;
  token: string;
  characterId: number;
};

export function CharacterDiceOverlay({ character, token, characterId }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <FloatingDiceButton onPress={() => setVisible(true)} />
      <DiceRollerModal
        visible={visible}
        onClose={() => setVisible(false)}
        token={token}
        characterId={characterId}
        character={character}
      />
    </>
  );
}

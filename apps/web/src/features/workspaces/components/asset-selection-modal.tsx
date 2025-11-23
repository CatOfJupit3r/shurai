import { ASSET_TYPE } from '@shurai/shared';

import { AssetPickerModal } from '@~/features/assets';

interface iAssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string) => void;
  selectedAssetId?: string;
}

export function AssetSelectionModal({ isOpen, onClose, onSelect, selectedAssetId }: iAssetSelectionModalProps) {
  return (
    <AssetPickerModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onSelect}
      selectedAssetId={selectedAssetId}
      filterTypes={[ASSET_TYPE.ICON, ASSET_TYPE.IMAGE]}
    />
  );
}

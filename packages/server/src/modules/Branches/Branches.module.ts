import { Module } from '@nestjs/common';
import { BranchesSettingsService } from './BranchesSettings';
import { BranchTransactionDTOTransformer } from './integrations/BranchTransactionDTOTransform';
import { ManualJournalBranchesDTOTransformer } from './integrations/ManualJournals/ManualJournalDTOTransformer.service';

/**
 * Single-location compatibility module.
 *
 * Transaction services still use these transformers to discard legacy
 * branch identifiers. Branch management controllers and event subscribers
 * are intentionally not registered.
 */
@Module({
  providers: [
    BranchesSettingsService,
    BranchTransactionDTOTransformer,
    ManualJournalBranchesDTOTransformer,
  ],
  exports: [
    BranchesSettingsService,
    BranchTransactionDTOTransformer,
    ManualJournalBranchesDTOTransformer,
  ],
})
export class BranchesModule {}

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { X } from 'lucide-react';

export interface LanguageTest {
  id: string;
  backendId?: string;
  testType: 'IELTS' | 'TOEFL' | 'Duolingo' | '';
  overallScore: string;
  showAdvanced: boolean;
  listening?: string;
  reading?: string;
  writing?: string;
  speaking?: string;
}

interface LanguageTestCardProps {
  test: LanguageTest;
  onUpdate: (id: string, updates: Partial<LanguageTest>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

/**
 * Language Test Card Component
 * 
 * Repeatable component for language test entries with advanced score breakdown.
 * 
 * Fields:
 * - testType: string ('IELTS' | 'TOEFL' | 'Duolingo')
 * - overallScore: number (0-9 for IELTS/Duolingo, 0-120 for TOEFL)
 * - showAdvanced: boolean
 * - listening: number (optional)
 * - reading: number (optional)
 * - writing: number (optional)
 * - speaking: number (optional)
 */
export function LanguageTestCard({ test, onUpdate, onRemove, canRemove }: LanguageTestCardProps) {
  const getScoreRange = () => {
    switch (test.testType) {
      case 'IELTS':
      case 'Duolingo':
        return { min: 0, max: 9, step: 0.5, placeholder: '0.0 - 9.0' };
      case 'TOEFL':
        return { min: 0, max: 120, step: 1, placeholder: '0 - 120' };
      default:
        return { min: 0, max: 120, step: 1, placeholder: '0 - 120' };
    }
  };

  const scoreRange = getScoreRange();

  return (
    <div className="bg-card border rounded-2xl p-6 space-y-4 relative">
      {/* Remove button */}
      {canRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(test.id)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove test</span>
        </Button>
      )}

      {/* Test Type and Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
        <div className="space-y-2">
          <Label htmlFor={`test-type-${test.id}`}>Test Type *</Label>
          <Select
            value={test.testType}
            onValueChange={(value) => onUpdate(test.id, { testType: value as LanguageTest['testType'] })}
          >
            <SelectTrigger id={`test-type-${test.id}`}>
              <SelectValue placeholder="Pilih jenis tes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IELTS">IELTS</SelectItem>
              <SelectItem value="TOEFL">TOEFL iBT</SelectItem>
              <SelectItem value="Duolingo">Tes Bahasa Inggris Duolingo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`overall-score-${test.id}`}>Overall Score *</Label>
          <Input
            id={`overall-score-${test.id}`}
            type="number"
            min={scoreRange.min}
            max={scoreRange.max}
            step={scoreRange.step}
            placeholder={scoreRange.placeholder}
            value={test.overallScore}
            onChange={(e) => onUpdate(test.id, { overallScore: e.target.value })}
          />
        </div>
      </div>

      {/* Advanced Toggle */}
      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id={`advanced-${test.id}`}
          checked={test.showAdvanced}
          onCheckedChange={(checked) => onUpdate(test.id, { showAdvanced: checked })}
        />
        <Label htmlFor={`advanced-${test.id}`} className="cursor-pointer text-sm">
          Tampilkan rincian skor
        </Label>
      </div>

      {/* Advanced Score Breakdown */}
      {test.showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor={`listening-${test.id}`} className="text-sm">Listening</Label>
            <Input
              id={`listening-${test.id}`}
              type="number"
              min={scoreRange.min}
              max={scoreRange.max}
              step={scoreRange.step}
              placeholder={scoreRange.placeholder}
              value={test.listening || ''}
              onChange={(e) => onUpdate(test.id, { listening: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`reading-${test.id}`} className="text-sm">Reading</Label>
            <Input
              id={`reading-${test.id}`}
              type="number"
              min={scoreRange.min}
              max={scoreRange.max}
              step={scoreRange.step}
              placeholder={scoreRange.placeholder}
              value={test.reading || ''}
              onChange={(e) => onUpdate(test.id, { reading: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`writing-${test.id}`} className="text-sm">Writing</Label>
            <Input
              id={`writing-${test.id}`}
              type="number"
              min={scoreRange.min}
              max={scoreRange.max}
              step={scoreRange.step}
              placeholder={scoreRange.placeholder}
              value={test.writing || ''}
              onChange={(e) => onUpdate(test.id, { writing: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`speaking-${test.id}`} className="text-sm">Speaking</Label>
            <Input
              id={`speaking-${test.id}`}
              type="number"
              min={scoreRange.min}
              max={scoreRange.max}
              step={scoreRange.step}
              placeholder={scoreRange.placeholder}
              value={test.speaking || ''}
              onChange={(e) => onUpdate(test.id, { speaking: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Trade } from '@/lib/types';
import { ValidatedInput } from '@/components/form/ValidatedInput';

const tradeTypes = [
  { value: 'buy', label: 'Buy', color: 'text-green-600' },
  { value: 'sell', label: 'Sell', color: 'text-red-600' },
] as const;

const outcomes = [
  { value: 'win', label: 'Win', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  { value: 'loss', label: 'Loss', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  { value: 'breakeven', label: 'Break Even', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
] as const;

export default function TradeLogPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'buy' as 'buy' | 'sell',
    outcome: 'win' as 'win' | 'loss' | 'breakeven',
    pnl: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateSymbolField = (symbol: string): string => {
    if (!symbol.trim()) return 'Trading symbol is required';
    if (symbol.length < 1) return 'Symbol too short';
    if (symbol.length > 10) return 'Symbol too long (max 10 characters)';
    if (!/^[A-Z0-9]+$/.test(symbol.toUpperCase())) return 'Symbol can only contain letters and numbers';
    return '';
  };

  const validatePnlField = (pnl: string): string => {
    if (pnl && isNaN(parseFloat(pnl))) return 'P&L must be a valid number';
    return '';
  };

  // Fetch recent emotion checks to link with trades
  const { data: recentEmotions } = useQuery({
    queryKey: ['emotions', 'recent'],
    queryFn: () => apiClient.getEmotionChecks(5, 0),
    enabled: !!user,
  });

  // Fetch recent trades
  const { data: recentTrades } = useQuery({
    queryKey: ['trades', 'recent'],
    queryFn: () => apiClient.getTrades(10, 0),
    enabled: !!user,
  });

  const createTradeMutation = useMutation({
    mutationFn: apiClient.createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast({
        title: 'Trade logged successfully! 📈',
        description: 'Your trade has been recorded.',
      });
      setFormData({
        symbol: '',
        type: 'buy',
        outcome: 'win',
        pnl: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to log trade',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to log trades.',
        variant: 'destructive',
      });
      return;
    }

    // Validate all fields
    const errors = {
      symbol: validateSymbolField(formData.symbol),
      pnl: validatePnlField(formData.pnl),
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      toast({
        title: 'Please fix the errors',
        description: 'Check the form for validation errors.',
        variant: 'destructive',
      });
      return;
    }

    // Link to most recent emotion check if available
    const latestEmotion = recentEmotions?.[0];
    const emotionCheckId = latestEmotion?.id;

    createTradeMutation.mutate({
      symbol: formData.symbol.toUpperCase(),
      type: formData.type,
      outcome: formData.outcome,
      pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
      emotionCheckId,
    });
  };

  return (
    <div className="max-w-md mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Log Your Trade
        </h1>
        <p className="text-muted-foreground">
          Quick trade entry with emotion linking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symbol Input */}
        <div className="space-y-2">
          <ValidatedInput
            id="symbol"
            label="Symbol"
            placeholder="e.g., AAPL, TSLA, BTC"
            value={formData.symbol}
            onChange={(e) => handleFieldChange('symbol', e.target.value.toUpperCase())}
            error={fieldErrors.symbol}
            disabled={createTradeMutation.isPending}
            className="uppercase text-lg font-mono"
            maxLength={10}
            required
          />
        </div>

        {/* Trade Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Trade Type</label>
          <div className="grid grid-cols-2 gap-3">
            {tradeTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleFieldChange('type', type.value)}
                disabled={createTradeMutation.isPending}
                className={cn(
                  'p-3 rounded-lg border text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  formData.type === type.value
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border hover:border-primary/50',
                  createTradeMutation.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Outcome</label>
          <div className="grid gap-2">
            {outcomes.map((outcome) => (
              <button
                key={outcome.value}
                type="button"
                onClick={() => handleFieldChange('outcome', outcome.value)}
                disabled={createTradeMutation.isPending}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  formData.outcome === outcome.value
                    ? cn(outcome.bg, outcome.color, 'font-medium')
                    : 'border-border hover:border-primary/50',
                  createTradeMutation.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {outcome.label}
              </button>
            ))}
          </div>
        </div>

        {/* P&L */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Profit/Loss (optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
              $
            </span>
            <ValidatedInput
              id="pnl"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.pnl}
              onChange={(e) => handleFieldChange('pnl', e.target.value)}
              error={fieldErrors.pnl}
              disabled={createTradeMutation.isPending}
              className="pl-8"
            />
          </div>
        </div>

        {/* Emotion Link Info */}
        {recentEmotions?.[0] && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Linked to emotion check:</span>{' '}
              Level {recentEmotions[0].level} ({formatRelativeTime(new Date(recentEmotions[0].timestamp))})
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={createTradeMutation.isPending}
          className="w-full h-12 text-base font-medium"
        >
          {createTradeMutation.isPending ? 'Logging...' : 'Log Trade'}
        </Button>
      </form>

      {/* Recent Trades */}
      {recentTrades && recentTrades.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
          <div className="space-y-2">
            {recentTrades.slice(0, 5).map((trade: Trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="font-mono font-bold">{trade.symbol}</div>
                  <div className={cn(
                    'text-xs px-2 py-1 rounded',
                    trade.outcome === 'win' ? 'bg-green-100 text-green-700' :
                    trade.outcome === 'loss' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {trade.outcome}
                  </div>
                </div>
                <div className="text-right">
                  {trade.pnl && (
                    <div className={cn(
                      'font-medium',
                      trade.pnl > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(trade.pnl)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(trade.timestamp))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

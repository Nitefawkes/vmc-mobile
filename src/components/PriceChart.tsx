import React from 'react';
import { StyleSheet, Text, View, Dimensions, useColorScheme } from 'react-native';
import { PriceHistory } from '@types/product';
import { Colors } from '@constants/colors';

interface PriceChartProps {
  priceHistory: PriceHistory[];
  targetPrice?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ priceHistory, targetPrice }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  if (priceHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No price history available
        </Text>
      </View>
    );
  }

  const prices = priceHistory.map(h => h.price);
  const maxPrice = Math.max(...prices, targetPrice || 0);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = Dimensions.get('window').width - 64;
  const chartHeight = 200;
  const padding = 40;

  const getX = (index: number) => {
    return (chartWidth - padding * 2) * (index / Math.max(priceHistory.length - 1, 1)) + padding;
  };

  const getY = (price: number) => {
    const normalized = (price - minPrice) / priceRange;
    return chartHeight - padding - normalized * (chartHeight - padding * 2);
  };

  const pathPoints = priceHistory
    .map((item, index) => {
      const x = getX(index);
      const y = getY(item.price);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.title, { color: colors.text }]}>Price History</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Price</Text>
          </View>
          {targetPrice && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Target</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={[styles.axisLabel, { color: colors.text }]}>{formatPrice(maxPrice)}</Text>
          <Text style={[styles.axisLabel, { color: colors.text }]}>
            {formatPrice((maxPrice + minPrice) / 2)}
          </Text>
          <Text style={[styles.axisLabel, { color: colors.text }]}>{formatPrice(minPrice)}</Text>
        </View>

        {/* Grid lines */}
        <View style={[styles.gridLine, { top: padding, borderColor: colors.border }]} />
        <View
          style={[
            styles.gridLine,
            { top: chartHeight / 2, borderColor: colors.border, opacity: 0.5 },
          ]}
        />
        <View
          style={[styles.gridLine, { top: chartHeight - padding, borderColor: colors.border }]}
        />

        {/* Target price line */}
        {targetPrice && targetPrice >= minPrice && targetPrice <= maxPrice && (
          <View
            style={[
              styles.targetLine,
              {
                top: getY(targetPrice),
                borderColor: colors.success,
                borderStyle: 'dashed',
              },
            ]}
          />
        )}

        {/* Price line path (simulated with positioned dots and connecting lines) */}
        {priceHistory.map((item, index) => {
          const x = getX(index);
          const y = getY(item.price);

          return (
            <React.Fragment key={item.id}>
              {/* Connecting line to previous point */}
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    {
                      position: 'absolute',
                      left: getX(index - 1),
                      top: getY(priceHistory[index - 1].price),
                      width: Math.sqrt(
                        Math.pow(x - getX(index - 1), 2) +
                          Math.pow(y - getY(priceHistory[index - 1].price), 2),
                      ),
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            y - getY(priceHistory[index - 1].price),
                            x - getX(index - 1),
                          )}rad`,
                        },
                      ],
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              )}

              {/* Data point */}
              <View
                style={[
                  styles.dataPoint,
                  {
                    left: x - 4,
                    top: y - 4,
                    backgroundColor: colors.primary,
                    borderColor: colors.background,
                  },
                ]}
              />
            </React.Fragment>
          );
        })}
      </View>

      {/* X-axis labels */}
      <View style={[styles.xAxisLabels, { width: chartWidth }]}>
        <Text style={[styles.axisLabel, { color: colors.text }]}>
          {formatDate(priceHistory[0].recordedAt)}
        </Text>
        <Text style={[styles.axisLabel, { color: colors.text }]}>
          {formatDate(priceHistory[priceHistory.length - 1].recordedAt)}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text }]}>Current</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatPrice(prices[prices.length - 1])}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text }]}>Lowest</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {formatPrice(minPrice)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text }]}>Highest</Text>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {formatPrice(maxPrice)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  chart: {
    position: 'relative',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 40,
    bottom: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  gridLine: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: 1,
    borderTopWidth: 1,
  },
  targetLine: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: 0,
    borderTopWidth: 2,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  connector: {
    height: 2,
    transformOrigin: 'left center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

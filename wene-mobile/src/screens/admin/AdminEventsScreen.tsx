import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, CategoryTabs, CountBadge, EventRow, AdminShell, StatusBadge } from '../../ui/components';
import { adminTheme } from '../../ui/adminTheme';
import { getMockAdminRole, setMockAdminRole, mockCategories } from '../../data/adminMock';
import { getSchoolDeps } from '../../api/createSchoolDeps';
import type { SchoolEvent } from '../../types/school';

export const AdminEventsScreen: React.FC = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [role, setRole] = useState(getMockAdminRole());
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const canManageCategories = role === 'admin';
  const canCreateEvent = role === 'admin' || role === 'operator';

  useEffect(() => {
    let cancelled = false;
    getSchoolDeps()
      .eventProvider.getAll()
      .then((items) => {
        if (!cancelled) setEvents(items);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell
      title="イベント一覧"
      role={role}
      onRoleChange={(nextRole) => {
        setRole(nextRole);
        setMockAdminRole(nextRole);
      }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="h2" style={styles.title}>
            イベント一覧
          </AppText>
          <View style={styles.headerActions}>
            {canCreateEvent ? (
              <Button title="イベント作成" variant="secondary" onPress={() => {}} />
            ) : null}
            {canManageCategories ? (
              <Button
                title="カテゴリ管理"
                variant="secondary"
                onPress={() => router.push('/admin/categories' as any)}
                style={styles.actionButton}
              />
            ) : null}
          </View>
        </View>

        <CategoryTabs
          categories={mockCategories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          tone="dark"
          style={styles.tabs}
        />

        <View style={styles.list}>
          {events.map((event) => (
            <EventRow
              key={event.id}
              title={event.title}
              datetime={event.datetime}
              host={event.host}
              leftSlot={
                <CountBadge
                  value={event.claimedCount ?? 0}
                  backgroundColor={adminTheme.colors.muted}
                  textColor={adminTheme.colors.textSecondary}
                />
              }
              rightSlot={<StatusBadge state={event.state ?? 'draft'} />}
              onPress={() => router.push(`/admin/events/${event.id}` as any)}
              style={styles.row}
            />
          ))}
        </View>

        <AppText variant="small" style={styles.note}>
          RT=現在までの参加完了数
        </AppText>
      </ScrollView>
    </AdminShell>
  );
};

const styles = StyleSheet.create({
  content: {
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminTheme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: adminTheme.spacing.sm,
  },
  title: {
    color: adminTheme.colors.text,
  },
  tabs: {
    marginBottom: adminTheme.spacing.md,
  },
  list: {
    backgroundColor: adminTheme.colors.surface,
    borderRadius: adminTheme.radius.md,
    borderWidth: 1,
    borderColor: adminTheme.colors.border,
    paddingHorizontal: adminTheme.spacing.md,
    marginBottom: adminTheme.spacing.lg,
  },
  row: {
    borderBottomColor: adminTheme.colors.border,
  },
  note: {
    color: adminTheme.colors.textTertiary,
    marginTop: adminTheme.spacing.sm,
  },
});

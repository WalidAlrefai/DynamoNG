import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoAlert } from '@dynamong/alert';
import { DynamoAvatar } from '@dynamong/avatar';
import { DynamoBreadcrumb } from '@dynamong/breadcrumb';
import type { DynamoBreadcrumbItem } from '@dynamong/breadcrumb';
import { DynamoButton } from '@dynamong/button';
import { DynamoCard } from '@dynamong/card';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoConfirmService } from '@dynamong/confirm-dialog';
import { DynamoDialog } from '@dynamong/dialog';
import { DynamoDivider } from '@dynamong/divider';
import { DynamoFileUpload } from '@dynamong/file-upload';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoPassword } from '@dynamong/password';
import { DynamoSelect } from '@dynamong/select';
import type { DynamoSelectOption } from '@dynamong/select';
import { DynamoSwitch } from '@dynamong/switch';
import { DynamoTab, DynamoTabs } from '@dynamong/tabs';
import { DynamoTable } from '@dynamong/table';
import type { DynamoTableCellContext, DynamoTableColumn } from '@dynamong/table';
import { DynamoTag } from '@dynamong/tag';
import { DynamoTextarea } from '@dynamong/textarea';
import { DynamoToastService } from '@dynamong/toast';
import { DynamoToolbar } from '@dynamong/toolbar';
import { TemplateSection } from '../components/template-section';

interface DirectoryMember {
  id: number;
  name: string;
  role: string;
  status: 'Active' | 'Invited';
}

const DIRECTORY_MEMBERS: DirectoryMember[] = [
  { id: 1, name: 'Ava Thompson', role: 'Engineering Lead', status: 'Active' },
  { id: 2, name: 'Noah Martinez', role: 'Product Designer', status: 'Active' },
  { id: 3, name: 'Priya Shah', role: 'Backend Engineer', status: 'Invited' },
  { id: 4, name: 'Liam Chen', role: 'Backend Engineer', status: 'Active' },
];

const DIRECTORY_ROLE_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Engineering Lead', value: 'Engineering Lead' },
  { label: 'Product Designer', value: 'Product Designer' },
  { label: 'Backend Engineer', value: 'Backend Engineer' },
];

const TIMEZONE_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'UTC', value: 'utc' },
  { label: 'Eastern Time', value: 'et' },
  { label: 'Pacific Time', value: 'pt' },
];

/**
 * Three real pages composed entirely from existing @dynamong/* components,
 * showing how they combine in practice — not a single-component demo like
 * every other doc page. Each section's local state lives directly on this
 * page's class (TemplateSection, like DocPageShell, is presentation-only and
 * has no scope of its own to hold it).
 */
@Component({
  selector: 'docs-templates-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoAlert,
    DynamoAvatar,
    DynamoBreadcrumb,
    DynamoButton,
    DynamoCard,
    DynamoCheckbox,
    DynamoDialog,
    DynamoDivider,
    DynamoFileUpload,
    DynamoInputText,
    DynamoPassword,
    DynamoSelect,
    DynamoSwitch,
    DynamoTab,
    DynamoTabs,
    DynamoTable,
    DynamoTag,
    DynamoTextarea,
    DynamoToolbar,
    FormsModule,
    TemplateSection,
  ],
  template: `
    <div class="space-y-12">
      <header>
        <h1 class="text-2xl font-bold text-text-primary">Templates</h1>
        <p class="mt-1 text-text-muted">
          Full pages built by composing DynamoNG components together — a starting point for your own screens.
        </p>
      </header>

      <docs-template-section
        name="Login"
        description="A centered authentication card with validation feedback and a remember-me option."
      >
        <div demo>
          <div class="mx-auto max-w-sm">
            <dg-card header="Sign in" subheader="Welcome back to DynamoNG">
              <div class="space-y-4">
                @if (loginFailed()) {
                  <dg-alert severity="danger" title="Sign-in failed" [closable]="true">
                    Check your email and password and try again.
                  </dg-alert>
                }
                <dg-input-text [(ngModel)]="loginEmail" placeholder="you@example.com" ariaLabel="Email" />
                <dg-password [(ngModel)]="loginPassword" placeholder="Password" ariaLabel="Password" />
                <dg-checkbox [(checked)]="loginRemember">Remember me</dg-checkbox>
                <dg-button styleClass="w-full" [loading]="loginSubmitting()" (click)="onLoginSubmit()">
                  Sign in
                </dg-button>
                <dg-divider>OR</dg-divider>
                <dg-button variant="text" styleClass="w-full">Create an account</dg-button>
              </div>
            </dg-card>
          </div>
        </div>
        <div code>
          &lt;dg-card header="Sign in"&gt;
            &lt;dg-input-text [(ngModel)]="email" ariaLabel="Email" /&gt;
            &lt;dg-password [(ngModel)]="password" ariaLabel="Password" /&gt;
            &lt;dg-checkbox [(checked)]="remember"&gt;Remember me&lt;/dg-checkbox&gt;
            &lt;dg-button [loading]="submitting()" (click)="onSubmit()"&gt;Sign in&lt;/dg-button&gt;
          &lt;/dg-card&gt;
        </div>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/card</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/alert</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/input-text</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/password</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/checkbox</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/button</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/divider</span>
      </docs-template-section>

      <docs-template-section
        name="Settings"
        description="A tabbed account-settings page — profile, security, and notification preferences in one card."
      >
        <div demo>
          <div class="max-w-xl">
            <dg-card
              header="Account settings"
              subheader="Manage your profile, security, and notification preferences"
            >
              <dg-tabs [(value)]="settingsTab">
                <dg-tab value="profile" label="Profile">
                  <div class="space-y-4">
                    <div class="flex items-center gap-4">
                      <dg-avatar [name]="settingsName()" size="lg" />
                      <dg-file-upload
                        [(value)]="settingsAvatarFiles"
                        ariaLabel="Profile photo"
                        label="Upload a new photo"
                      />
                    </div>
                    <dg-input-text [(ngModel)]="settingsName" ariaLabel="Full name" placeholder="Full name" />
                    <dg-input-text [(ngModel)]="settingsEmail" ariaLabel="Email" placeholder="Email" />
                    <dg-textarea [(ngModel)]="settingsBio" ariaLabel="Bio" placeholder="Tell us about yourself" />
                    <dg-select
                      [options]="timezoneOptions"
                      [(value)]="settingsTimezone"
                      ariaLabel="Timezone"
                      placeholder="Choose a timezone"
                    />
                  </div>
                </dg-tab>
                <dg-tab value="security" label="Security">
                  <div class="space-y-4">
                    <dg-password
                      [(ngModel)]="settingsNewPassword"
                      [showStrengthMeter]="true"
                      ariaLabel="New password"
                      placeholder="New password"
                    />
                    <dg-switch [(checked)]="settingsTwoFactor">Two-factor authentication</dg-switch>
                  </div>
                </dg-tab>
                <dg-tab value="notifications" label="Notifications">
                  <div class="space-y-3">
                    <dg-switch [(checked)]="settingsNotifyProduct">Product updates</dg-switch>
                    <dg-switch [(checked)]="settingsNotifySecurity">Security alerts</dg-switch>
                    <dg-divider />
                    <dg-switch [(checked)]="settingsNotifyMarketing">Marketing emails</dg-switch>
                  </div>
                </dg-tab>
              </dg-tabs>
              <div footer class="flex justify-end gap-2">
                <dg-button variant="text">Cancel</dg-button>
                <dg-button severity="primary">Save changes</dg-button>
              </div>
            </dg-card>
          </div>
        </div>
        <div code>
          &lt;dg-card header="Account settings"&gt;
            &lt;dg-tabs [(value)]="tab"&gt;
              &lt;dg-tab value="profile" label="Profile"&gt;...&lt;/dg-tab&gt;
              &lt;dg-tab value="security" label="Security"&gt;...&lt;/dg-tab&gt;
              &lt;dg-tab value="notifications" label="Notifications"&gt;...&lt;/dg-tab&gt;
            &lt;/dg-tabs&gt;
          &lt;/dg-card&gt;
        </div>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/card</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/tabs</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/avatar</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/file-upload</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/input-text</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/textarea</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/select</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/password</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/switch</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/divider</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/button</span>
      </docs-template-section>

      <docs-template-section
        name="Team Directory"
        description="A searchable, paginated user-management list with add-member and delete-confirm flows."
      >
        <div demo>
          <ng-template #memberCell let-row>
            <div class="flex items-center gap-2">
              <dg-avatar [name]="row.name" size="sm" />
              <span class="text-text-primary">{{ row.name }}</span>
            </div>
          </ng-template>
          <ng-template #statusCell let-row>
            <dg-tag [severity]="row.status === 'Active' ? 'success' : 'warning'" size="sm">{{ row.status }}</dg-tag>
          </ng-template>
          <ng-template #actionsCell let-row>
            <div class="flex justify-end gap-2">
              <dg-button size="sm" variant="text">Edit</dg-button>
              <dg-button size="sm" variant="text" severity="danger" (click)="onDeleteMember(row)">Delete</dg-button>
            </div>
          </ng-template>

          <div class="space-y-4">
            <dg-breadcrumb [items]="directoryBreadcrumb" />
            <dg-toolbar ariaLabel="Team directory actions">
              <span start class="font-semibold text-text-primary">Team</span>
              <div center class="flex gap-2">
                <dg-input-text
                  [(ngModel)]="directorySearch"
                  placeholder="Search by name"
                  ariaLabel="Search members"
                />
                <dg-select
                  [options]="directoryRoleOptions"
                  [(value)]="directoryRoleFilter"
                  ariaLabel="Filter by role"
                  placeholder="All roles"
                  [clearable]="true"
                />
              </div>
              <dg-button end (click)="addMemberOpen.set(true)">Add member</dg-button>
            </dg-toolbar>
            <dg-table
              [columns]="directoryColumns()"
              [data]="filteredDirectoryMembers()"
              ariaLabel="Team members"
              [pageSize]="3"
              [(page)]="directoryPage"
            />
          </div>

          <dg-dialog [open]="addMemberOpen()" (openChange)="addMemberOpen.set($event)" title="Add member">
            <div class="space-y-3">
              <dg-input-text [(ngModel)]="newMemberName" placeholder="Full name" ariaLabel="Full name" />
              <dg-select
                [options]="directoryRoleOptions"
                [(value)]="newMemberRole"
                ariaLabel="Role"
                placeholder="Choose a role"
              />
            </div>
            <div class="mt-4 flex justify-end gap-2">
              <dg-button variant="text" (click)="addMemberOpen.set(false)">Cancel</dg-button>
              <dg-button (click)="onAddMember()">Send invite</dg-button>
            </div>
          </dg-dialog>
        </div>
        <div code>
          &lt;dg-toolbar&gt;
            &lt;dg-input-text center [(ngModel)]="search" /&gt;
            &lt;dg-button end (click)="addMemberOpen.set(true)"&gt;Add member&lt;/dg-button&gt;
          &lt;/dg-toolbar&gt;
          &lt;dg-table [columns]="columns" [data]="filteredMembers()" [(page)]="page" /&gt;
        </div>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/breadcrumb</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/toolbar</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/input-text</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/select</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/button</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/table</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/avatar</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/tag</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/dialog</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/confirm-dialog</span>
        <span components class="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-text-muted">@dynamong/toast</span>
      </docs-template-section>
    </div>
  `,
})
export class TemplatesPage {
  private readonly toast = inject(DynamoToastService);
  private readonly confirm = inject(DynamoConfirmService);

  // --- Login -----------------------------------------------------------
  protected readonly loginEmail = signal('');
  protected readonly loginPassword = signal('');
  protected readonly loginRemember = signal(false);
  protected readonly loginSubmitting = signal(false);
  protected readonly loginFailed = signal(false);

  protected onLoginSubmit(): void {
    this.loginFailed.set(false);
    this.loginSubmitting.set(true);
    setTimeout(() => {
      this.loginSubmitting.set(false);
      this.loginFailed.set(!this.loginEmail() || !this.loginPassword());
    }, 500);
  }

  // --- Settings ----------------------------------------------------------
  protected readonly settingsTab = signal('profile');
  protected readonly settingsName = signal('Ada Lovelace');
  protected readonly settingsEmail = signal('ada@example.com');
  protected readonly settingsBio = signal('Building things with Angular.');
  protected readonly settingsTimezone = signal<string | null>('utc');
  protected readonly settingsAvatarFiles = signal<File[]>([]);
  protected readonly settingsNewPassword = signal('');
  protected readonly settingsTwoFactor = signal(false);
  protected readonly settingsNotifyProduct = signal(true);
  protected readonly settingsNotifySecurity = signal(true);
  protected readonly settingsNotifyMarketing = signal(false);
  protected readonly timezoneOptions = TIMEZONE_OPTIONS;

  // --- Team Directory ------------------------------------------------------
  protected readonly directoryBreadcrumb: DynamoBreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Team' },
  ];
  protected readonly directoryRoleOptions = DIRECTORY_ROLE_OPTIONS;
  protected readonly directoryMembers = signal<DirectoryMember[]>(DIRECTORY_MEMBERS);
  protected readonly directorySearch = signal('');
  protected readonly directoryRoleFilter = signal<string | null>(null);
  protected readonly directoryPage = signal(1);
  protected readonly addMemberOpen = signal(false);
  protected readonly newMemberName = signal('');
  protected readonly newMemberRole = signal<string | null>(null);

  private readonly memberCellTpl =
    viewChild.required<TemplateRef<DynamoTableCellContext<DirectoryMember>>>('memberCell');
  private readonly statusCellTpl =
    viewChild.required<TemplateRef<DynamoTableCellContext<DirectoryMember>>>('statusCell');
  private readonly actionsCellTpl =
    viewChild.required<TemplateRef<DynamoTableCellContext<DirectoryMember>>>('actionsCell');

  protected readonly directoryColumns = computed<DynamoTableColumn<DirectoryMember>[]>(() => [
    { field: 'name', header: 'Name', sortable: true, cellTemplate: this.memberCellTpl() },
    { field: 'role', header: 'Role', sortable: true },
    { field: 'status', header: 'Status', sortable: true, cellTemplate: this.statusCellTpl() },
    { field: 'actions', header: '', cellTemplate: this.actionsCellTpl() },
  ]);

  protected readonly filteredDirectoryMembers = computed(() => {
    const search = this.directorySearch().trim().toLowerCase();
    const role = this.directoryRoleFilter();
    return this.directoryMembers().filter((member) => {
      const matchesSearch = !search || member.name.toLowerCase().includes(search);
      const matchesRole = !role || member.role === role;
      return matchesSearch && matchesRole;
    });
  });

  protected onAddMember(): void {
    const name = this.newMemberName().trim();
    const role = this.newMemberRole();
    if (!name || !role) return;
    this.directoryMembers.update((members) => [
      ...members,
      { id: Date.now(), name, role, status: 'Invited' },
    ]);
    this.newMemberName.set('');
    this.newMemberRole.set(null);
    this.addMemberOpen.set(false);
    this.toast.success(`Invited ${name}.`);
  }

  protected async onDeleteMember(member: DirectoryMember): Promise<void> {
    const confirmed = await this.confirm.open({
      title: 'Remove member',
      message: `Remove ${member.name} from the team? This cannot be undone.`,
      severity: 'danger',
      confirmLabel: 'Remove',
    });
    if (!confirmed) return;
    this.directoryMembers.update((members) => members.filter((m) => m.id !== member.id));
    this.toast.success(`Removed ${member.name}.`);
  }
}

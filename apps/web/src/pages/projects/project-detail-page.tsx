import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PencilSimple, Trash, ArrowLeft, BookOpenText, ClipboardText } from "@phosphor-icons/react";
import { createLibrarySchema } from "@testhub/shared";
import type { CreateLibraryInput, Library } from "@testhub/shared";
import { useProject, useUpdateProject, useDeleteProject } from "../../api/projects";
import { useLibraries, useCreateLibrary, useUpdateLibrary, useDeleteLibrary } from "../../api/libraries";
import { usePlans } from "../../api/plans";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { PlanStatusBadge } from "../../components/plan-status-badge";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { LoadingSpinner } from "../../components/loading-spinner";

export function ProjectDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const projectId = Number(params.projectId);

  const project = useProject(projectId);
  const libraries = useLibraries(projectId);
  const plans = usePlans(projectId);
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const createLibraryMutation = useCreateLibrary(projectId);
  const updateLibraryMutation = useUpdateLibrary(projectId);
  const deleteLibraryMutation = useDeleteLibrary(projectId);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [createLibraryOpen, setCreateLibraryOpen] = useState(false);
  const [editLibrary, setEditLibrary] = useState<Library | null>(null);
  const [deleteLibraryTarget, setDeleteLibraryTarget] = useState<Library | null>(null);

  const projectName = project.data?.name ?? `项目 ${projectId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{projectName}</h2>
            <p className="text-muted-foreground">
              {project.data?.description || "在此管理用例库与测试计划。"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditProjectOpen(true)}>
            <PencilSimple className="mr-2 h-4 w-4" />
            编辑
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteProjectOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            删除
          </Button>
          <Button size="sm" asChild>
            <Link to={`/projects/${projectId}/plans`}>
              <ClipboardText className="mr-2 h-4 w-4" />
              测试计划
            </Link>
          </Button>
        </div>
      </div>

      {/* Libraries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpenText className="h-5 w-5" />
            用例库
          </h3>
          <Button size="sm" onClick={() => setCreateLibraryOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新建用例库
          </Button>
        </div>
        {libraries.isLoading && <LoadingSpinner label="加载用例库中…" className="py-8" size="sm" />}
        {libraries.error && <p className="text-destructive">{libraries.error.message}</p>}
        {!libraries.isLoading && !libraries.error && libraries.data && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>标识码</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraries.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无用例库，请先创建一个以添加测试用例。
                    </TableCell>
                  </TableRow>
                )}
                {libraries.data.items.map((library) => (
                  <TableRow key={library.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/projects/${projectId}/libraries/${library.id}`}
                        className="text-primary hover:underline"
                      >
                        {library.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{library.code}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[250px] truncate">
                      {library.description || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(library.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditLibrary(library)}>
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteLibraryTarget(library)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Plans Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardText className="h-5 w-5" />
            测试计划
          </h3>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/projects/${projectId}/plans`}>查看全部</Link>
          </Button>
        </div>
        {plans.isLoading && <LoadingSpinner label="加载计划中…" className="py-8" size="sm" />}
        {plans.error && <p className="text-destructive">{plans.error.message}</p>}
        {!plans.isLoading && !plans.error && plans.data && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      暂无测试计划。
                    </TableCell>
                  </TableRow>
                )}
                {plans.data.items.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/projects/${projectId}/plans/${plan.id}`}
                        className="text-primary hover:underline"
                      >
                        {plan.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlanStatusBadge status={plan.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      {editProjectOpen && project.data && (
        <EditProjectDialog
          open={editProjectOpen}
          onOpenChange={setEditProjectOpen}
          defaultValues={{ name: project.data.name, description: project.data.description ?? "" }}
          onSubmit={(values) => {
            updateProjectMutation.mutate({ id: projectId, ...values }, {
              onSuccess: () => setEditProjectOpen(false)
            });
          }}
          loading={updateProjectMutation.isPending}
          error={updateProjectMutation.error?.message}
        />
      )}

      {/* Delete Project Confirm */}
      <ConfirmDialog
        open={deleteProjectOpen}
        onOpenChange={setDeleteProjectOpen}
        title="删除项目"
        description={`确定要删除「${projectName}」吗？将同时删除其下所有用例库、用例和测试计划，且无法恢复。`}
        confirmLabel="删除"
        onConfirm={() => {
          deleteProjectMutation.mutate(projectId, {
            onSuccess: () => navigate("/projects")
          });
        }}
        loading={deleteProjectMutation.isPending}
      />

      {/* Create Library Dialog */}
      <LibraryFormDialog
        open={createLibraryOpen}
        onOpenChange={setCreateLibraryOpen}
        onSubmit={(values) => {
          createLibraryMutation.mutate(values, {
            onSuccess: () => setCreateLibraryOpen(false)
          });
        }}
        loading={createLibraryMutation.isPending}
        error={createLibraryMutation.error?.message}
      />

      {/* Edit Library Dialog */}
      {editLibrary && (
        <LibraryFormDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditLibrary(null); }}
          defaultValues={{ name: editLibrary.name, code: editLibrary.code, description: editLibrary.description ?? "" }}
          onSubmit={(values) => {
            updateLibraryMutation.mutate({ id: editLibrary.id, ...values }, {
              onSuccess: () => setEditLibrary(null)
            });
          }}
          loading={updateLibraryMutation.isPending}
          error={updateLibraryMutation.error?.message}
          title="编辑用例库"
        />
      )}

      {/* Delete Library Confirm */}
      <ConfirmDialog
        open={deleteLibraryTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteLibraryTarget(null); }}
        title="删除用例库"
        description={`确定要删除「${deleteLibraryTarget?.name}」吗？该库下所有用例与目录将被永久删除。`}
        confirmLabel="删除"
        onConfirm={() => {
          if (deleteLibraryTarget) {
            deleteLibraryMutation.mutate(deleteLibraryTarget.id, {
              onSuccess: () => setDeleteLibraryTarget(null)
            });
          }
        }}
        loading={deleteLibraryMutation.isPending}
      />
    </div>
  );
}

/* ---- Edit Project Dialog ---- */

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: { name: string; description: string };
  onSubmit: (values: { name?: string; description?: string }) => void;
  loading: boolean;
  error?: string;
}

function EditProjectDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  loading,
  error: submitError
}: EditProjectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit((values) => {
          onSubmit({
            name: values.name?.trim() || undefined,
            description: values.description?.trim() || undefined
          });
        })}>
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
            <DialogDescription>更新项目信息。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-project-name">名称</Label>
              <Input id="edit-project-name" {...register("name", { required: "请填写名称" })} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-project-description">描述</Label>
              <Textarea id="edit-project-description" {...register("description")} />
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={loading}>{loading ? "保存中…" : "保存"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---- Library Form Dialog ---- */

interface LibraryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: { name: string; code: string; description: string };
  onSubmit: (values: CreateLibraryInput) => void;
  loading: boolean;
  error?: string;
  title?: string;
}

function LibraryFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  loading,
  error: submitError,
  title = "新建用例库"
}: LibraryFormDialogProps) {
  const isEdit = title !== "新建用例库";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateLibraryInput>({
    resolver: zodResolver(createLibrarySchema),
    defaultValues: defaultValues ?? { name: "", code: "", description: "" }
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit((values) => {
          onSubmit({
            name: values.name,
            code: values.code,
            description: values.description?.trim() || undefined
          });
        })}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "更新用例库信息。"
                : "新建测试用例库。标识码须为 4 位大写字母或数字。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="library-name">名称</Label>
              <Input id="library-name" placeholder="API 测试" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="library-code">标识码（4 位，A-Z 或 0-9）</Label>
              <Input
                id="library-code"
                placeholder="APIS"
                maxLength={4}
                className="uppercase"
                {...register("code")}
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="library-description">描述</Label>
              <Textarea id="library-description" placeholder="选填描述" {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>取消</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中…" : isEdit ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

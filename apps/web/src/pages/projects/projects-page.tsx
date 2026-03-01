import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { createProjectSchema } from "@testhub/shared";
import type { CreateProjectInput, Project } from "@testhub/shared";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "../../api/projects";
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
import { ConfirmDialog } from "../../components/confirm-dialog";
import { LoadingSpinner } from "../../components/loading-spinner";

export function ProjectsPage() {
  const { data, isLoading, error } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">项目</h2>
          <p className="text-muted-foreground">创建项目后，可在此管理用例库与测试计划。</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建项目
        </Button>
      </div>

      {isLoading && <LoadingSpinner label="加载项目中…" className="py-12" />}
      {error && <p className="text-destructive">{error.message}</p>}

      {!isLoading && !error && data && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    暂无项目，请先创建一个。
                  </TableCell>
                </TableRow>
              )}
              {data.items.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link to={`/projects/${project.id}`} className="text-primary hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {project.description || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditProject(project)}>
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(project)}>
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

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(values) => {
          createMutation.mutate(values, {
            onSuccess: () => setCreateOpen(false)
          });
        }}
        loading={createMutation.isPending}
        error={createMutation.error?.message}
      />

      {editProject && (
        <ProjectFormDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditProject(null); }}
          defaultValues={{ name: editProject.name, description: editProject.description ?? "" }}
          onSubmit={(values) => {
            updateMutation.mutate({ id: editProject.id, ...values }, {
              onSuccess: () => setEditProject(null)
            });
          }}
          loading={updateMutation.isPending}
          error={updateMutation.error?.message}
          title="编辑项目"
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="删除项目"
        description={`确定要删除「${deleteTarget?.name}」吗？将同时删除其下所有用例库、用例和测试计划，且无法恢复。`}
        confirmLabel="删除"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null)
            });
          }
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: { name: string; description: string };
  onSubmit: (values: CreateProjectInput) => void;
  loading: boolean;
  error?: string;
  title?: string;
}

function ProjectFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  loading,
  error: submitError,
  title = "新建项目"
}: ProjectFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: defaultValues ?? { name: "", description: "" }
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form
          onSubmit={handleSubmit((values) => {
            onSubmit({
              name: values.name,
              description: values.description?.trim() || undefined
            });
          })}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {title === "新建项目"
                ? "新建项目以管理测试用例库和测试计划。"
                : "更新项目信息。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">名称</Label>
              <Input id="project-name" placeholder="核心平台" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">描述</Label>
              <Textarea id="project-description" placeholder="选填项目描述" {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中…" : title === "新建项目" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { PlusCircle, Copy, Check, Users, Calendar, MapPin, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { fleetFormSchema, type Fleet, type FleetFormData } from "@shared/schema";

function getStatusVariant(status: string): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "active": return "default";
    case "completed": return "secondary";
    case "cancelled": return "destructive";
    default: return "outline";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "active": return "활성";
    case "completed": return "완료됨";
    case "cancelled": return "취소됨";
    default: return status;
  }
}

function formatDateTime(date: string | Date | null): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy년 M월 d일 HH:mm", { locale: ko });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ description: "UUID가 클립보드에 복사되었습니다" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      data-testid="button-copy-uuid"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function CreateFleetDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FleetFormData>({
    resolver: zodResolver(fleetFormSchema),
    defaultValues: {
      operationName: "",
      description: "",
      location: "",
      scheduledAt: new Date(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FleetFormData) => {
      const res = await apiRequest("POST", "/api/fleets", {
        ...data,
        scheduledAt: data.scheduledAt.toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets/my/list"] });
      toast({ description: "플릿이 생성되었습니다" });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || "플릿 생성에 실패했습니다" 
      });
    },
  });

  const onSubmit = (data: FleetFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-fleet">
          <PlusCircle className="mr-2 h-4 w-4" />
          새 플릿 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 플릿 생성</DialogTitle>
          <DialogDescription>
            플릿 정보를 입력하세요. 생성 후 UUID를 멤버들에게 공유하세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="operationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>작전명</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: Stratop Fountain" 
                      {...field} 
                      data-testid="input-operation-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>작전 일시</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      data-testid="input-scheduled-at"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장소 (선택)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: Nisuwa" 
                      {...field} 
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="플릿에 대한 추가 정보..." 
                      className="resize-none"
                      {...field} 
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-submit-fleet"
              >
                {createMutation.isPending ? "생성 중..." : "플릿 생성"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function FleetCard({ fleet }: { fleet: Fleet }) {
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/fleets/${fleet.id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets/my/list"] });
      toast({ description: "플릿 상태가 변경되었습니다" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || "상태 변경에 실패했습니다" 
      });
    },
  });

  return (
    <Card data-testid={`card-fleet-${fleet.id}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{fleet.operationName}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateTime(fleet.scheduledAt)}
              </span>
              {fleet.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {fleet.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {fleet.fcCharacterName}
              </span>
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(fleet.status)}>
            {getStatusLabel(fleet.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fleet.description && (
          <p className="text-sm text-muted-foreground">{fleet.description}</p>
        )}
        
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-3">
          <code className="flex-1 break-all text-sm font-mono" data-testid="text-fleet-uuid">
            {fleet.id}
          </code>
          <CopyButton text={fleet.id} />
        </div>

        {fleet.status === "active" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate("completed")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-complete-fleet"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              완료
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate("cancelled")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-cancel-fleet"
            >
              <XCircle className="mr-1 h-4 w-4" />
              취소
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FleetManagement() {
  const { data: fleets, isLoading } = useQuery<Fleet[]>({
    queryKey: ["/api/fleets/my/list"],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">플릿 관리</h1>
          <p className="text-muted-foreground">
            플릿을 생성하고 UUID를 멤버들에게 공유하세요
          </p>
        </div>
        <CreateFleetDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : fleets && fleets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {fleets.map((fleet) => (
            <FleetCard key={fleet.id} fleet={fleet} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold">아직 플릿이 없습니다</h3>
            <p className="mt-2 text-muted-foreground">
              첫 플릿을 생성하여 시작하세요
            </p>
            <div className="mt-4">
              <CreateFleetDialog />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

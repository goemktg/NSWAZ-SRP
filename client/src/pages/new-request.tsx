import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2, HelpCircle, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ParsedKillmail {
  killmailId: number;
  shipTypeId: number;
  shipTypeName: string;
  shipTypeNameKo?: string;
  groupName?: string;
  iskValue: number;
  killmailTime: string;
  victimCharacterId?: number;
}

const formSchema = z.object({
  killmailUrl: z.string().url("올바른 URL을 입력해주세요").refine(
    (url) => url.includes("zkillboard.com"),
    "URL은 zKillboard에서 가져와야 합니다"
  ),
  fleetName: z.string().min(1, "함대명을 입력해주세요"),
  fcName: z.string().min(1, "FC 이름을 입력해주세요"),
  lossDescription: z.string().min(10, "최소 10자 이상의 설명을 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [parsedData, setParsedData] = useState<ParsedKillmail | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      killmailUrl: "",
      fleetName: "",
      fcName: "",
      lossDescription: "",
    },
  });

  const parseMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/killmail/parse", { url });
      return response.json() as Promise<ParsedKillmail>;
    },
    onSuccess: (data) => {
      setParsedData(data);
      setParseError(null);
    },
    onError: (error: Error) => {
      setParsedData(null);
      setParseError(error.message || "킬메일 파싱에 실패했습니다");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!parsedData) {
        throw new Error("킬메일 정보를 먼저 파싱해주세요");
      }
      return apiRequest("POST", "/api/srp-requests", {
        ...data,
        shipTypeId: parsedData.shipTypeId,
        shipTypeName: parsedData.shipTypeName,
        iskAmount: parsedData.iskValue,
      });
    },
    onSuccess: () => {
      toast({
        title: "요청 제출 완료",
        description: "SRP 요청이 검토를 위해 제출되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/srp-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setLocation("/my-requests");
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message || "요청 제출에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const handleUrlBlur = () => {
    const url = form.getValues("killmailUrl");
    if (url && url.includes("zkillboard.com/kill/")) {
      parseMutation.mutate(url);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (!parsedData) {
      toast({
        title: "오류",
        description: "킬메일 정보를 먼저 파싱해주세요",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(data);
  };

  const formatIsk = (millions: number) => {
    if (millions >= 1000) {
      return `${(millions / 1000).toFixed(1)}B ISK`;
    }
    return `${millions.toLocaleString()}M ISK`;
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">새 SRP 요청</h1>
        <p className="text-muted-foreground">
          함선 손실에 대한 보상 요청을 제출하세요
        </p>
      </div>

      <Card data-testid="card-request-form">
        <CardHeader>
          <CardTitle>요청 세부사항</CardTitle>
          <CardDescription>
            킬메일 URL을 입력하면 함선 정보와 손실 금액이 자동으로 입력됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="killmailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      킬메일 URL
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="mb-2">
                            <a 
                              href="https://forums.nisuwaz.com/t/srp/965" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary underline inline-flex items-center gap-1"
                            >
                              SRP 신청 방법 가이드
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            를 참고하여 킬메일 URL을 복사하세요.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://zkillboard.com/kill/..."
                        data-testid="input-killmail-url"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          handleUrlBlur();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      URL 입력 후 바깥을 클릭하면 자동으로 정보를 가져옵니다
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {parseMutation.isPending && (
                <div className="flex items-center gap-2 text-muted-foreground" data-testid="status-parsing">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>킬메일 정보 가져오는 중...</span>
                </div>
              )}

              {parseError && (
                <div className="flex items-center gap-2 text-destructive" data-testid="status-parse-error">
                  <AlertCircle className="h-4 w-4" />
                  <span>{parseError}</span>
                </div>
              )}

              {parsedData && (
                <Card className="bg-muted/50" data-testid="card-parsed-killmail">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="font-medium">킬메일 정보 확인됨</span>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">함선:</span>
                        <span className="font-medium" data-testid="text-parsed-ship">
                          {parsedData.shipTypeName}
                          {parsedData.groupName && (
                            <span className="text-muted-foreground ml-1">
                              ({parsedData.groupName})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">손실 금액:</span>
                        <span className="font-medium" data-testid="text-parsed-value">
                          {formatIsk(parsedData.iskValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">손실 시각:</span>
                        <span data-testid="text-parsed-time">
                          {new Date(parsedData.killmailTime).toLocaleString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fleetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>함대명</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 방어 플릿"
                          data-testid="input-fleet-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fcName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FC 이름</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="함대 사령관 이름"
                          data-testid="input-fc-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lossDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>손실 설명</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="손실 상황을 설명해주세요..."
                        className="min-h-[100px] resize-none"
                        data-testid="textarea-description"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      작전 중 함선이 어떻게 손실되었는지 간략히 설명해주세요
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || !parsedData}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitMutation.isPending ? "제출 중..." : "요청 제출"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/my-requests")}
                  data-testid="button-cancel"
                >
                  취소
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

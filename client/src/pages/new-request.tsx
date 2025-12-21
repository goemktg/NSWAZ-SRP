import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2, HelpCircle, Search } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ShipData } from "@shared/schema";

const formSchema = z.object({
  shipTypeId: z.number().min(1, "함선을 선택해주세요"),
  shipTypeName: z.string().optional(),
  killmailUrl: z.string().url("올바른 URL을 입력해주세요").refine(
    (url) => url.includes("zkillboard.com") || url.includes("esi.evetech.net"),
    "URL은 zKillboard 또는 EVE ESI에서 가져와야 합니다"
  ),
  iskAmount: z.coerce.number().min(1, "ISK 금액은 최소 1백만 이상이어야 합니다"),
  fleetName: z.string().min(1, "함대명을 입력해주세요"),
  fcName: z.string().min(1, "FC 이름을 입력해주세요"),
  lossDescription: z.string().min(10, "최소 10자 이상의 설명을 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [shipSearchOpen, setShipSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ships, isLoading: shipsLoading } = useQuery<ShipData[]>({
    queryKey: ["/api/ships"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipTypeId: 0,
      shipTypeName: "",
      killmailUrl: "",
      iskAmount: 0,
      fleetName: "",
      fcName: "",
      lossDescription: "",
    },
  });

  const selectedShipId = form.watch("shipTypeId");
  const selectedShip = useMemo(() => {
    if (!ships || !selectedShipId) return null;
    return ships.find(s => s.typeID === selectedShipId);
  }, [ships, selectedShipId]);

  const filteredShips = useMemo(() => {
    if (!ships) return [];
    if (!searchQuery) return ships.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return ships
      .filter(ship => 
        ship.typeName.toLowerCase().includes(query) ||
        ship.typeNameKo.includes(searchQuery) ||
        ship.groupName.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [ships, searchQuery]);

  const groupedShips = useMemo(() => {
    const groups: Record<string, ShipData[]> = {};
    filteredShips.forEach(ship => {
      if (!groups[ship.groupName]) {
        groups[ship.groupName] = [];
      }
      groups[ship.groupName].push(ship);
    });
    return groups;
  }, [filteredShips]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/srp-requests", data);
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

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
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
            모든 필수 항목을 작성하여 SRP 요청을 제출하세요. 정확한 정보를 제공하면
            승인 절차가 빨라집니다.
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
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>zkillboard.com에서 손실 킬메일을 찾아 URL을 복사하세요</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://zkillboard.com/kill/..."
                        data-testid="input-killmail-url"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      zKillboard 또는 EVE ESI 링크
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shipTypeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>함선 유형</FormLabel>
                    <Popover open={shipSearchOpen} onOpenChange={setShipSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={shipSearchOpen}
                            className="justify-between"
                            data-testid="select-ship-type"
                          >
                            {selectedShip ? (
                              <span>
                                {selectedShip.typeName} 
                                <span className="ml-2 text-muted-foreground">
                                  ({selectedShip.groupName})
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {shipsLoading ? "로딩 중..." : "손실한 함선 선택"}
                              </span>
                            )}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="함선 검색..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            data-testid="input-ship-search"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {shipsLoading ? "로딩 중..." : "검색 결과 없음"}
                            </CommandEmpty>
                            {Object.entries(groupedShips).map(([groupName, groupShips]) => (
                              <CommandGroup key={groupName} heading={groupName}>
                                {groupShips.map((ship) => (
                                  <CommandItem
                                    key={ship.typeID}
                                    value={ship.typeID.toString()}
                                    onSelect={() => {
                                      field.onChange(ship.typeID);
                                      form.setValue("shipTypeName", ship.typeName);
                                      setShipSearchOpen(false);
                                    }}
                                    data-testid={`option-ship-${ship.typeID}`}
                                  >
                                    {ship.typeName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iskAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>손실 금액 (백만 ISK 단위)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="예: 150은 1억 5천만 ISK"
                        data-testid="input-isk-amount"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      헐과 피팅을 포함한 총 손실 금액
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={mutation.isPending}
                  data-testid="button-submit"
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mutation.isPending ? "제출 중..." : "요청 제출"}
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

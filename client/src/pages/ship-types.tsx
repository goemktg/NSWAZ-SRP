import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rocket, Search, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShipData } from "@shared/schema";

export default function ShipTypes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [versionCheckError, setVersionCheckError] = useState<string | null>(null);

  const { data: ships, isLoading } = useQuery<ShipData[]>({
    queryKey: ["/api/ships"],
  });

  const { data: catalogInfo } = useQuery<{ version: string; totalShips: number; isLoaded: boolean }>({
    queryKey: ["/api/ships/catalog/info"],
  });

  const parseVersionToDate = (version: string): Date | null => {
    // Handle "2025-12-21" format
    const dashMatch = version.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dashMatch) {
      return new Date(parseInt(dashMatch[1]), parseInt(dashMatch[2]) - 1, parseInt(dashMatch[3]));
    }
    // Handle "20250707" format
    const numMatch = version.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (numMatch) {
      return new Date(parseInt(numMatch[1]), parseInt(numMatch[2]) - 1, parseInt(numMatch[3]));
    }
    return null;
  };

  const compareVersions = (current: string, latest: string): "up-to-date" | "needs-update" | "unknown" => {
    if (current === latest) return "up-to-date";
    
    const currentDate = parseVersionToDate(current);
    const latestDate = parseVersionToDate(latest);
    
    if (currentDate && latestDate) {
      return currentDate >= latestDate ? "up-to-date" : "needs-update";
    }
    
    // Fallback to string comparison
    return current >= latest ? "up-to-date" : "needs-update";
  };

  const checkLatestVersion = async () => {
    setIsCheckingVersion(true);
    setVersionCheckError(null);
    try {
      const response = await fetch("https://raw.githubusercontent.com/eveseat/resources/master/sde.json");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setLatestVersion(data.version || null);
    } catch {
      setVersionCheckError("버전 확인 실패");
    } finally {
      setIsCheckingVersion(false);
    }
  };

  useEffect(() => {
    checkLatestVersion();
  }, []);

  const versionStatus = catalogInfo?.version && latestVersion 
    ? compareVersions(catalogInfo.version, latestVersion) 
    : null;
  const isUpToDate = versionStatus === "up-to-date";
  const needsUpdate = versionStatus === "needs-update";

  const groups = useMemo(() => {
    if (!ships) return [];
    const groupSet = new Set(ships.map(s => s.groupName));
    return Array.from(groupSet).sort();
  }, [ships]);

  const filteredShips = useMemo(() => {
    if (!ships) return [];
    
    let filtered = ships;
    
    if (selectedGroup !== "all") {
      filtered = filtered.filter(s => s.groupName === selectedGroup);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.typeName.toLowerCase().includes(query) ||
        s.typeNameKo.includes(searchQuery) ||
        s.groupName.toLowerCase().includes(query)
      );
    }
    
    return filtered.slice(0, 100);
  }, [ships, selectedGroup, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">함선 목록</h1>
        <p className="text-muted-foreground">
          EVE Online 함선 데이터베이스 (SDE 기반)
        </p>
      </div>

      <Card data-testid="card-ships-table">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                함선 카탈로그
              </CardTitle>
              {catalogInfo && (
                <CardDescription className="flex items-center gap-2 flex-wrap">
                  <span>버전: {catalogInfo.version}</span>
                  <span>|</span>
                  <span>총 {catalogInfo.totalShips}개 함선</span>
                  {isUpToDate && (
                    <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      최신
                    </Badge>
                  )}
                  {needsUpdate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          업데이트 필요 ({latestVersion})
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        최신 버전: {latestVersion}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {versionCheckError && (
                    <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700">
                      {versionCheckError}
                    </Badge>
                  )}
                </CardDescription>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkLatestVersion}
                  disabled={isCheckingVersion}
                  data-testid="button-check-version"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingVersion ? "animate-spin" : ""}`} />
                  버전 확인
                </Button>
              </TooltipTrigger>
              <TooltipContent>GitHub에서 최신 SDE 버전 확인</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="함선 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-[200px]" data-testid="select-group">
                <SelectValue placeholder="그룹 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 그룹</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredShips.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>함선명</TableHead>
                    <TableHead>한글명</TableHead>
                    <TableHead>그룹</TableHead>
                    <TableHead>Type ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShips.map((ship) => (
                    <TableRow key={ship.typeID} data-testid={`row-ship-${ship.typeID}`}>
                      <TableCell className="font-medium">{ship.typeName}</TableCell>
                      <TableCell className="text-muted-foreground">{ship.typeNameKo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ship.groupName}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {ship.typeID}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredShips.length >= 100 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  처음 100개 결과를 표시합니다. 검색어를 입력하여 필터링하세요.
                </p>
              )}
            </div>
          ) : (
            <div className="py-12 text-center" data-testid="text-no-ships">
              <Rocket className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">검색 결과 없음</h3>
              <p className="mt-2 text-muted-foreground">
                다른 검색어나 필터를 시도해보세요
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

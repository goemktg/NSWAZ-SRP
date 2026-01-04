import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rocket, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const { data: ships, isLoading } = useQuery<ShipData[]>({
    queryKey: ["/api/ships"],
  });

  const { data: catalogInfo } = useQuery<{ version: string; totalShips: number; isLoaded: boolean }>({
    queryKey: ["/api/ships/catalog/info"],
  });

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
                <CardDescription>
                  버전: {catalogInfo.version} | 총 {catalogInfo.totalShips}개 함선
                </CardDescription>
              )}
            </div>
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

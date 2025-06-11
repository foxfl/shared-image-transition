import AlbumEntry from "@/components/album-entry";
import GalleryHeader from "@/components/gallery-header";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    StyleSheet,
    View,
    ViewToken,
} from "react-native";

const { height: windowHeight } = Dimensions.get("window");
const PAGE_SIZE = 21;

export default function Home() {
  const [albums, setAlbums] =
    useState<MediaLibrary.PagedInfo<MediaLibrary.Asset> | null>(null);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [earliestDate, setEarliestDate] = useState<Date | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: MediaLibrary.Asset }) => <AlbumEntry item={item} />,
    []
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const dates = viewableItems
          .map((item) => item.item?.creationTime)
          .filter((date): date is number => date !== undefined);

        if (dates.length > 0) {
          const earliest = new Date(Math.min(...dates));
          setEarliestDate(earliest);
        }
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  async function getAlbums(page: number = 1) {
    if (permissionResponse?.status !== "granted") {
      await requestPermission();
    }

    setIsLoading(true);
    try {
      const fetchedAlbums = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: page > 1 ? albums?.endCursor : undefined,
      });

      if (page === 1) {
        setAlbums(fetchedAlbums);
      } else {
        setAlbums((prev) => {
          if (!prev) return fetchedAlbums;
          return {
            ...fetchedAlbums,
            assets: [...prev.assets, ...fetchedAlbums.assets],
          };
        });
      }
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadPreviousPage = () => {
    if (currentPage > 1 && !isLoading) {
      getAlbums(currentPage - 1);
    }
  };

  useEffect(() => {
    getAlbums();
  }, []);

  return (
    <View style={[styles.container]}>
      <FlatList
        data={albums?.assets ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        inverted={true}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={() => {
          if (albums?.hasNextPage && !isLoading) {
            getAlbums(currentPage + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        onScrollBeginDrag={({ nativeEvent }) => {
          if (nativeEvent.contentOffset.y <= 0 && !isLoading) {
            loadPreviousPage();
          }
        }}
        ListFooterComponent={() =>
          isLoading ? <View style={styles.loader} /> : null
        }
      />
      <GalleryHeader earliestDate={earliestDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: windowHeight * 0.15,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  imageContainer: {
    flex: 1,
    margin: 1,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  loader: {
    height: 50,
    width: "100%",
  },
});

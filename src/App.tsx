import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Alchemy, Network, Nft, OwnedNftsResponse } from "alchemy-sdk";
import { useState } from "react";
import { useWeb3Account } from "./hooks/useWeb3Account";

const { VITE_ALCHEMY_API_KEY } = import.meta.env;

function App() {
  const [account, connect] = useWeb3Account();
  const [userAddress, setUserAddress] = useState("");
  const [ownedNfts, setOwnedNfts] = useState<OwnedNftsResponse["ownedNfts"]>(
    []
  );
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState<Nft[]>([]);

  const isConnected = account !== "";

  async function getNFTsForOwner() {
    const config = {
      apiKey: VITE_ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.nft.getNftsForOwner(userAddress);
    setOwnedNfts(data.ownedNfts);

    const tokenDataPromises = [];

    for (let i = 0; i < data.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data.ownedNfts[i].contract.address,
        data.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }

    const nfts = await Promise.all(tokenDataPromises);

    setTokenDataObjects(nfts);
    setHasQueried(true);
  }
  return (
    <Box w="100vw">
      <nav>
        <Flex alignItems="center" justifyContent="space-between">
          <h1 className="logo">Ndex</h1>
          {isConnected ? (
            <Box>{account}</Box>
          ) : (
            <Button onClick={connect}>Connect</Button>
          )}
        </Flex>
      </nav>
      <Center>
        <Flex
          alignItems={"center"}
          justifyContent="center"
          flexDirection={"column"}
        >
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setUserAddress(event.target.value)
          }
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="blue">
          Fetch NFTs
        </Button>

        <Heading my={36}>Here are your NFTs:</Heading>

        {hasQueried ? (
          <SimpleGrid w={"90vw"} columns={4} spacing={24}>
            {ownedNfts.map((nft, i) => {
              const image = tokenDataObjects[i].rawMetadata?.image;
              return (
                <Flex
                  flexDir={"column"}
                  color="white"
                  bg="blue"
                  w={"20vw"}
                  key={nft.tokenId}
                >
                  <Box>
                    <b>Name:</b> {tokenDataObjects[i].title}&nbsp;
                  </Box>
                  <Image src={image} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          "Please make a query! The query may take a few seconds..."
        )}
      </Flex>
    </Box>
  );
}

export default App;

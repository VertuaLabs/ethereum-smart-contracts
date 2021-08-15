// contracts/PermissiveAuction.sol
// SPDX-License-Identifier:  UNLICENCED
pragma solidity ^0.8.0;

// NOTE: the vscode lint error is expected. Use hardhat and it works.
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

// The minimal interface that we need for interacting with supported Token
// Contracts, which for now is limited to ERC721 conforming contracts.
interface ITokenContract {
  function ownerOf(uint256) external returns (address);

  function safeTransferFrom(
    address,
    address,
    uint256
  ) external;
}

enum TokenType {
  ERC721
}

enum AuctionState {
  CREATED,
  READY,
  RUNNING,
  COUNTINGDOWN,
  ENDED,
  CANCELLED
}

struct Token {
  TokenType tokenType;
  address contractAddress;
  uint256 id;
}

struct HighestBid {
  address bidder;
  uint256 bid; //
}

struct Auction {
  string name;
  address seller;
  uint256 reserve;
  Token token;
  AuctionState state;
  uint16 duration; // in hours
  uint256 endTime; // unix end time of auction, this gets created when the auction goes into countdown mode
  HighestBid highestBid;
  address winner;
  // Total amount bid that can be returned to an address
  mapping(address => uint256) pendingReturns;
}

contract PermissiveAuction is ERC721Holder, Ownable, AccessControl {
  // bytes32 public constant AUCTIONEER_ROLE = keccak256("AUCTIONEER_ROLE");
  bytes32 public constant AUCTION_CREATOR_ROLE =
    keccak256('AUCTION_CREATOR_ROLE');

  string public name; // The name of the auction contract

  bool public isPermissive; // When true, anyone can create an auction; escapes access control checks
  bool public isPaused; // No new auction can be created when paused

  uint256 public adminRate; // Percent that the owner of this contract takes (0-100)

  // For auto-incremented Auction Id
  using Counters for Counters.Counter;
  Counters.Counter private _auctionIdTracker;

  // Makes sure we don't duplicate auctions
  mapping(uint256 => address) private _auctionClaimed;

  mapping(uint256 => Auction) public auctions;

  // EVENTS
  event PermissiveMode(bool isPermissive);

  event Paused(bool isPaused);

  event AuctionCreated(
    address sellerAddress,
    uint256 auctionId,
    address tokenAddress,
    uint256 tokenId,
    uint256 reserve
  );

  event TokenOwner(
    uint256 auctionId,
    address tokenAddress,
    uint256 tokenId,
    address tokenOwner
  );

  event OwnershipVerified(
    uint256 auctionId,
    address tokenAddress,
    uint256 tokenId,
    bool isVerified
  );

  event HighestBidIncreased(
    uint256 auctionId,
    address bidder,
    uint256 amount,
    string comment //bid comment
  );

  event AuctionStateChange(uint256 auctionId, AuctionState newState);

  event AuctionStarted(uint256 auctionId, bool started);

  event AuctionCountdownStarted(uint256 auctionId, uint256 endTime);

  event AuctionExtended(uint256 auctionId, uint256 newEndTime);

  event AuctionEnded(
    uint256 auctionId,
    address winner,
    uint256 amount,
    uint256 payout
  );

  event AuctionCancelled(uint256 auctionId);

  event Received(address, uint256);

  constructor(
    string memory _name,
    uint256 _adminRate,
    bool _isPermissive,
    bool _isPaused
  ) {
    require(
      _adminRate >= 0 && _adminRate <= 100,
      'Admin Rate must be between 0 and 100'
    );

    name = _name;
    adminRate = _adminRate;
    isPermissive = _isPermissive;
    isPaused = _isPaused;
  }

  // MODIFIERS
  modifier onlyAuctionSeller(uint256 auctionId) {
    require(
      msg.sender == auctions[auctionId].seller,
      'Permission denied. Caller is not the auction seller.'
    );
    _;
  }

  modifier hasAuctionCreatorRole(uint256 auctionId) {
    require(
      hasRole(AUCTION_CREATOR_ROLE, msg.sender),
      'Permission denied. Caller does not have AUCTION_CREATOR_ROLE'
    );
    _;
  }

  // Need to implement this function to be able to properly receive ERC721 tokens. See intro on <https://docs.openzeppelin.com/contracts/2.x/api/token/erc721>
  function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
  ) public pure override returns (bytes4) {
    return this.onERC721Received.selector;
  }

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }

  fallback() external {
    // ...
  }

  function setPermissiveMode(bool _isPermissive)
    public
    onlyOwner
    returns (bool)
  {
    isPermissive = _isPermissive;
    emit PermissiveMode(_isPermissive);
    return isPermissive;
  }

  function setPauseMode(bool _isPaused) public onlyOwner returns (bool) {
    isPaused = _isPaused;
    emit Paused(isPaused);
    return isPaused;
  }

  ///  Creates a new Auction and autogenerates the Auction Id
  ///
  function createAuction(
    string calldata _name,
    address _tokenAddress,
    uint256 _tokenId,
    uint256 _reserve
  ) public returns (uint256) {
    require(isPaused == false, 'Auction creation is paused');
    if (!isPermissive) {
      require(
        hasRole(AUCTION_CREATOR_ROLE, msg.sender),
        'Permission denied. Permissive mode is off. Caller does not have AUCTION_CREATOR_ROLE'
      );
    }

    uint256 _auctionId = _auctionIdTracker.current();
    _auctionIdTracker.increment();
    return
      _createAuction({
        _name: _name,
        _sellerAddress: msg.sender,
        _tokenAddress: _tokenAddress,
        _tokenId: _tokenId,
        _reserve: _reserve,
        _auctionId: _auctionId
      });
  }

  /// Creates a new Auction and assigns the provided Auction Id
  ///
  function createAuction(
    string calldata _name,
    address _tokenAddress,
    uint256 _tokenId,
    uint256 _reserve,
    uint256 _auctionId
  ) public returns (uint256) {
    require(isPaused == false, 'Auction creation is paused');
    if (!isPermissive) {
      require(
        hasRole(AUCTION_CREATOR_ROLE, msg.sender),
        'Permission denied. Permissive mode is off. Caller does not have AUCTION_CREATOR_ROLE'
      );
    }

    return
      _createAuction({
        _name: _name,
        _sellerAddress: msg.sender,
        _tokenAddress: _tokenAddress,
        _tokenId: _tokenId,
        _reserve: _reserve,
        _auctionId: _auctionId
      });
  }

  function _createAuction(
    string calldata _name,
    address _sellerAddress,
    address _tokenAddress,
    uint256 _tokenId,
    uint256 _reserve,
    uint256 _auctionId
  ) internal returns (uint256) {
    // check that the auction address is open; it should be zeroed out unless it's already been claimed; throw an error
    require(
      _auctionClaimed[_auctionId] == address(0),
      'Auction Id already taken'
    );

    _auctionClaimed[_auctionId] = _sellerAddress; //claim this auction id

    Auction storage _auction = auctions[_auctionId];

    _auction.name = _name;
    _auction.seller = _sellerAddress;
    _auction.reserve = _reserve;

    _auction.token.contractAddress = _tokenAddress;
    _auction.token.id = _tokenId;

    _auction.state = AuctionState.CREATED;

    emit AuctionCreated(
      _sellerAddress,
      _auctionId,
      _tokenAddress,
      _tokenId,
      _reserve
    );
    return _auctionId;
  }

  function isBiddable(uint256 _auctionId) public view returns (bool) {
    Auction storage _auction = auctions[_auctionId];
    AuctionState state = _auction.state;

    return state == AuctionState.RUNNING || state == AuctionState.COUNTINGDOWN;
  }

  function _isCountingDown(uint256 _auctionId) private view returns (bool) {
    Auction storage _auction = auctions[_auctionId];
    return _auction.state == AuctionState.COUNTINGDOWN;
  }

  /// Returns the Address of the current owner of an auction item
  /// nb: this is a transaction, so need to emit an event too
  ///
  function tokenOwner(uint256 _auctionId) public returns (address) {
    Auction storage _auction = auctions[_auctionId];
    ITokenContract tokenContract = ITokenContract(
      _auction.token.contractAddress
    );
    address _tokenOwner = tokenContract.ownerOf(_auction.token.id);

    emit TokenOwner(
      _auctionId,
      _auction.token.contractAddress,
      _auction.token.id,
      _tokenOwner
    );
    return _tokenOwner;
  }

  function startAuction(uint256 _auctionId)
    public
    onlyAuctionSeller(_auctionId)
    returns (bool)
  {
    Auction storage _auction = auctions[_auctionId];
    require(
      _auction.state == AuctionState.CREATED,
      'Auction not in CREATED State'
    );

    // Make sure the auction owns the Token
    // Then change the state
    if (tokenOwner(_auctionId) == address(this)) {
      _auction.state = AuctionState.RUNNING;
      emit AuctionStarted(_auctionId, true);
      return true;
    }
    emit AuctionStarted(_auctionId, false);
    return false;
  }

  /// Start an existing Auction to a (default) 24-hour countdown
  ///
  function startAuctionCountdown(uint256 _auctionId) private returns (uint256) {
    Auction storage _auction = auctions[_auctionId];
    require(_auction.state == AuctionState.RUNNING, 'Auction not running');
    require(_auction.highestBid.bid >= _auction.reserve, 'Reserve not yet met');
    // TODO: use a time period other than default 24-hours
    _auction.endTime = block.timestamp + 24 hours;
    _auction.state = AuctionState.COUNTINGDOWN;
    emit AuctionCountdownStarted(_auctionId, _auction.endTime);
    return _auction.endTime;
  }

  /// Bid on a given auction
  /// - if a bid happens within 5 mins of end of auction,
  ///   the auction is automatically extended by 15 mins
  function bid(
    uint256 _auctionId,
    string calldata _comment //TODO: <240 char/length
  ) public payable {
    require(isBiddable(_auctionId), 'Auction is not biddable');

    Auction storage _auction = auctions[_auctionId];

    require(
      _auction.state == AuctionState.RUNNING ||
        (_auction.state == AuctionState.COUNTINGDOWN &&
          block.timestamp <= _auction.endTime),
      'Auction not running or already already ended.'
    );

    uint256 _highestBid = _auction.highestBid.bid;
    require(msg.value > _highestBid, 'There already is a higher bid.');

    if (_highestBid != 0) {
      // Sending back the money by simply using
      // highestBidder.send(highestBid) is a security risk
      // because it could execute an untrusted contract.
      // It is always safer to let the recipients
      // withdraw their money themselves.
      _auction.pendingReturns[_auction.highestBid.bidder] += _highestBid;
    }
    _auction.highestBid.bidder = msg.sender;
    _auction.highestBid.bid = msg.value;
    emit HighestBidIncreased(_auctionId, msg.sender, msg.value, _comment);

    if (!_isCountingDown(_auctionId) && msg.value >= _auction.reserve) {
      startAuctionCountdown(_auctionId);
    }

    if (
      _isCountingDown(_auctionId) &&
      _auction.endTime - block.timestamp <= 5 minutes
    ) {
      _auction.endTime += 15 minutes;
      emit AuctionExtended(_auctionId, _auction.endTime);
    }
  }

  /// Allow a Bidder, who is no longer the highest Bidder, to withdraw
  ///   all of their prior bids as a single amount
  ///
  function withdraw(uint256 _auctionId) public returns (bool) {
    Auction storage _auction = auctions[_auctionId];
    uint256 amount = _auction.pendingReturns[msg.sender];
    if (amount > 0) {
      // It is important to set this to zero because the recipient
      // can call this function again as part of the receiving call
      // before `send` returns.
      _auction.pendingReturns[msg.sender] = 0;

      if (!payable(msg.sender).send(amount)) {
        // No need to call throw here, just reset the amount owing
        _auction.pendingReturns[msg.sender] = amount;
        return false;
      }
    }
    return true;
  }

  function endAuction(uint256 _auctionId) public onlyAuctionSeller(_auctionId) {
    // It is a good guideline to structure functions that interact
    // with other contracts (i.e. they call functions or send Ether)
    // into three phases:
    // 1. checking conditions
    // 2. performing actions (potentially changing conditions)
    // 3. interacting with other contracts
    // If these phases are mixed up, the other contract could call
    // back into the current contract and modify the state or cause
    // effects (ether payout) to be performed multiple times.
    // If functions called internally include interaction with external
    // contracts, they also have to be considered interaction with
    // external contracts.

    Auction storage _auction = auctions[_auctionId];

    // 1. Conditions
    require(
      _auction.state == AuctionState.COUNTINGDOWN,
      'Auction countdown not yet start.'
    );

    // Require the auction to not have already been ended or cancelled
    require(
      _auction.state != AuctionState.CANCELLED ||
        _auction.state != AuctionState.ENDED,
      'Auction has already ended or been cancelled.'
    );

    require(block.timestamp >= _auction.endTime, 'Auction not yet ended.');

    // 2. Effects
    _auction.state = AuctionState.ENDED;

    // TODO: check the overflow math issues around this
    uint256 adminFee = (_auction.highestBid.bid * adminRate) / 100;
    uint256 payout = _auction.highestBid.bid - adminFee;

    emit AuctionEnded(
      _auctionId,
      _auction.highestBid.bidder,
      _auction.highestBid.bid,
      payout
    );

    // 3. Interaction
    // pay to the auction seller
    address payable _seller = payable(_auction.seller);
    _seller.transfer(payout);
    // pay to the auction contract owner
    address payable _owner = payable(owner());
    _owner.transfer(adminFee);
  }

  /// Cancel an Auction that is not yet Ended of Cancelled
  function cancelAuction(uint256 _auctionId)
    public
    onlyAuctionSeller(_auctionId)
  {
    Auction storage _auction = auctions[_auctionId];

    _auction.state = AuctionState.CANCELLED;
    emit AuctionCancelled(_auctionId);
  }

  /// Allow an Auction seller to withdraw their token
  function withdrawToken(uint256 _auctionId)
    public
    onlyAuctionSeller(_auctionId)
  {
    Auction storage _auction = auctions[_auctionId];

    // Tokens can't be returned if a 'live' biddable auction (RUNNING or COUNTINGDOWN) is going on
    require(
      _auction.state != AuctionState.RUNNING ||
        _auction.state != AuctionState.COUNTINGDOWN,
      'Auction is biddable. First cancel or end auction to return token.'
    );

    ITokenContract _tokenContract = ITokenContract(
      _auction.token.contractAddress
    );

    _tokenContract.safeTransferFrom(
      payable(address(this)),
      _auction.seller,
      _auction.token.id
    );
  }

  /// Allow an Auction winner to claim their token
  function transferTokenToWinner(uint256 _auctionId) public payable {
    Auction storage _auction = auctions[_auctionId];
    require(_auction.state == AuctionState.ENDED, 'Auction not yet ended.');

    ITokenContract _tokenContract = ITokenContract(
      _auction.token.contractAddress
    );

    _tokenContract.safeTransferFrom(
      payable(address(this)),
      _auction.highestBid.bidder,
      _auction.token.id
    );
  }
}

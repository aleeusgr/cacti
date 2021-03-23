/*
 * Copyright 2021 Hyperledger Cactus Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * BusinessLogicRunTransaction.ts
 */

import { Request } from 'express';
import { RequestInfo } from './RequestInfo';
//import { MeterManagement } from './MeterManagement';
//import { MeterInfo } from './MeterInfo';
import { TradeInfo } from '../../packages/routing-interface/TradeInfo';
import { transactionManagement } from '../../packages/routing-interface/routes/index';
import { verifierFactory } from '../../packages/routing-interface/routes/index';
import { BusinessLogicBase } from '../../packages/business-logic-plugin/BusinessLogicBase';
//import { makeRawTransaction } from './TransactionEthereum'
//import { LedgerEvent } from '../../packages/ledger-plugin/LedgerPlugin';
import { json2str } from '../../packages/ledger-plugin/DriverCommon'

const fs = require('fs');
const path = require('path');
const config: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./config/default.json"), 'utf8'));
import { getLogger } from "log4js";
const moduleName = 'BusinessLogicRunTransaction';
const logger = getLogger(`${moduleName}`);
logger.level = config.logLevel;

export class BusinessLogicRunTransaction extends BusinessLogicBase {
    businessLogicID: string;

    constructor(businessLogicID: string) {
        super();
        this.businessLogicID = businessLogicID;
    }

    startTransaction(req: Request, businessLogicID: string, tradeID: string) {

        logger.debug("called startTransaction()");

        // set RequestInfo
        const requestInfo: RequestInfo = new RequestInfo();
        requestInfo.setBusinessLogicID(businessLogicID);
        requestInfo.keychainId = req.body.tradeParams[0];
        requestInfo.keychainRef = req.body.tradeParams[1];
        requestInfo.channelName = req.body.tradeParams[2];
        requestInfo.invocationType = req.body.tradeParams[3];
        requestInfo.functionName = req.body.tradeParams[4];
        requestInfo.functionArgs = req.body.tradeParams[5];
        logger.debug(`tradeParams: ${req.body.tradeParams}`);

        // set TradeID
        requestInfo.setTradeID(tradeID);

        // Create trade information
        const tradeInfo: TradeInfo = new TradeInfo(requestInfo.businessLogicID, requestInfo.tradeID);
        
        this.execTransaction(requestInfo, tradeInfo);
        
    }


    execTransaction(requestInfo: RequestInfo, tradeInfo: TradeInfo) {

        logger.debug("called execTransaction()");

        const useValidator = JSON.parse(transactionManagement.getValidatorToUse(tradeInfo.businessLogicID));
        const verifier = verifierFactory.getVerifier(useValidator['validatorID'][0], {}, false);
        logger.debug("getVerifier");
        
        const contract = {};
        const method = {command: "run-transaction"};
        const args = {"args": {
            "keychainId": requestInfo.keychainId,
            "keychainRef": requestInfo.keychainRef,
            "channelName": requestInfo.channelName,
            "invocationType": requestInfo.invocationType,
            "functionName": requestInfo.functionName,
            "functionArgs": requestInfo.functionArgs
          }};

        verifier.requestLedgerOperationHttp(contract, method, args);

    }


}
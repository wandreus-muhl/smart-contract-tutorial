/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { TicketContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logger = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('TicketContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new TicketContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"ticket 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"ticket 1002 value"}'));
    });

    describe('#ticketExists', () => {

        it('should return true for a ticket', async () => {
            await contract.ticketExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a ticket that does not exist', async () => {
            await contract.ticketExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createTicket', () => {

        it('should create a ticket', async () => {
            await contract.createTicket(ctx, '1003', 'ticket 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"ticket 1003 value"}'));
        });

        it('should throw an error for a ticket that already exists', async () => {
            await contract.createTicket(ctx, '1001', 'myvalue').should.be.rejectedWith(/The ticket 1001 already exists/);
        });

    });

    describe('#readTicket', () => {

        it('should return a ticket', async () => {
            await contract.readTicket(ctx, '1001').should.eventually.deep.equal({ value: 'ticket 1001 value' });
        });

        it('should throw an error for a ticket that does not exist', async () => {
            await contract.readTicket(ctx, '1003').should.be.rejectedWith(/The ticket 1003 does not exist/);
        });

    });

    describe('#updateTicket', () => {

        it('should update a ticket', async () => {
            await contract.updateTicket(ctx, '1001', 'ticket 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"ticket 1001 new value"}'));
        });

        it('should throw an error for a ticket that does not exist', async () => {
            await contract.updateTicket(ctx, '1003', 'ticket 1003 new value').should.be.rejectedWith(/The ticket 1003 does not exist/);
        });

    });

    describe('#deleteTicket', () => {

        it('should delete a ticket', async () => {
            await contract.deleteTicket(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a ticket that does not exist', async () => {
            await contract.deleteTicket(ctx, '1003').should.be.rejectedWith(/The ticket 1003 does not exist/);
        });

    });

});

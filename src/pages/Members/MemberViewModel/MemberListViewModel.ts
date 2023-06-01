/*
 * @copyright   Copyright (C) 2022 AesirX. All rights reserved.
 * @license     GNU General Public License version 3, see LICENSE.
 */

import { makeAutoObservable, runInAction } from 'mobx';
import { ORGANISATION_MEMBER_FIELD } from 'aesirx-lib';
import { PAGE_STATUS } from 'constant';
import { MemberStore } from '../store';
import moment from 'moment';
import { notify } from 'components';

class MemberListViewModel {
  memberStore: MemberStore;
  formStatus = PAGE_STATUS.READY;
  memberListViewModel = {};
  items = [];
  filter = {};
  successResponse: { [key: string]: any } = {
    state: false,
    content_id: '',
    listPublishStatus: [],
    1: [],
    filters: {
      'list[limit]': 10,
    },
    listMembers: [],
    pagination: null,
  };

  constructor(memberStore: MemberStore) {
    makeAutoObservable(this);
    this.memberStore = memberStore;
  }

  setForm = (memberListViewModel: any) => {
    this.memberListViewModel = memberListViewModel;
  };

  initializeData = async () => {
    runInAction(() => {
      this.successResponse.state = false;
    });
    const data = await this.memberStore.getList(this.successResponse.filters);

    runInAction(() => {
      if (!data?.error) {
        this.onSuccessHandler(data?.response, '');
      } else {
        this.onErrorHandler(data?.response);
      }
      this.successResponse.state = true;
    });
  };

  getListByFilter = async (key: any, value: any) => {
    value ? (this.successResponse.filters[key] = value) : delete this.successResponse.filters[key];

    //pagination
    if (key != 'list[limitstart]' && key != 'list[limit]') {
      delete this.successResponse.filters['list[limitstart]'];
    } else {
      if (
        key == 'list[limit]' &&
        value * this.successResponse.pagination.page >= this.successResponse.pagination.totalItems
      ) {
        this.successResponse.filters['list[limitstart]'] =
          Math.ceil(this.successResponse.pagination.totalItems / value - 1) * value;
      } else if (
        key == 'list[limit]' &&
        value * this.successResponse.pagination.page < this.successResponse.pagination.totalItems
      ) {
        this.successResponse.filters['list[limitstart]'] =
          (this.successResponse.pagination.page - 1) * value;
      }
    }

    const data = await this.memberStore.getList(this.successResponse.filters);
    runInAction(() => {
      if (!data?.error) {
        this.onSuccessHandler(data?.response, '');
      } else {
        this.onErrorHandler(data?.response);
      }
      this.successResponse.state = true;
    });
  };

  onSuccessHandler = (result: any, message: any) => {
    if (result && message) {
      notify(message, 'success');
    }
    if (result?.listItems) {
      this.successResponse.listMembers = this.transform(result?.listItems);
      this.successResponse.pagination = result?.pagination;
      this.items = result?.listItems;
    }
    if (result?.listPublishStatus) {
      this.successResponse.listPublishStatus = result?.listPublishStatus;
    }
  };

  onErrorHandler = (error: any) => {
    error._messages[0]?.message
      ? notify(error._messages[0]?.message, 'error')
      : error.message && notify(error.message, 'error');
    this.successResponse.state = false;
    this.successResponse.content_id = error.result;
    this.formStatus = PAGE_STATUS.READY;
  };

  transform = (data: any) => {
    return data.map((o: any) => {
      const date = moment(o[ORGANISATION_MEMBER_FIELD.MODIFIED_TIME]).format('DD MMM, YYYY');
      return {
        member: {
          id: o[ORGANISATION_MEMBER_FIELD.ID],
          name: o[ORGANISATION_MEMBER_FIELD.MEMBER_NAME],
        },
        memberEmail: o[ORGANISATION_MEMBER_FIELD.MEMBER_EMAIL],
        memberRole: o[ORGANISATION_MEMBER_FIELD.MEMBER_ROLE],
        organisation: o[ORGANISATION_MEMBER_FIELD.ORGANISATION],
        lastModified: {
          status: o[ORGANISATION_MEMBER_FIELD.PUBLISHED],
          dateTime: date ?? '',
          author: o[ORGANISATION_MEMBER_FIELD.CREATED_USER_NAME],
        },
        published: {
          state: o[ORGANISATION_MEMBER_FIELD.PUBLISHED],
          id: o[ORGANISATION_MEMBER_FIELD.ID],
        },
      };
    });
  };

  deleteMembers = async (arr: any) => {
    const data = await this.memberStore.delete(arr);
    runInAction(async () => {
      if (!data?.error) {
        await this.initializeData();
        this.onSuccessHandler(data?.response, 'Deleted successfully');
      } else {
        this.onErrorHandler(data?.response);
      }
      this.successResponse.state = true;
    });
  };

  isLoading = () => {
    runInAction(() => {
      this.successResponse.state = false;
    });
  };
}

export default MemberListViewModel;
